import {EventEmitter} from '../helpers/event-emitter/event-emitter';
import {FHConfig} from '../config';
import {ForceHorseHelper} from '../helpers/force-horse/force-horse.helper';
import * as d3 from 'd3';
import now from 'performance-now';
import {debugLog} from '../helpers/debug-logger/debug-logger';

/**
 * Produces a class-viewer for each viewer of ForceHorse on a page
 */
export class ForceHorseViewer {
  constructor(element, requestRender) {
    debugLog('ForceHorseViewer:constructor', element, requestRender);

    this.element = element;
    this.requestRender = requestRender;

    // Set up event listeners for all possible events
    this.readyEvent = new EventEmitter();
    this.doubleClickEvent = new EventEmitter();
    this.hoverEvent = new EventEmitter();
    this.selectEvent = new EventEmitter();
    this.filterEvent = new EventEmitter();

    this.setConfig(); // Set default config
  }

  setData(data) {
    debugLog('ForceHorseViewer:setOptions', data);

    this.data = data;
  }

  /**
   * Draws a new graph, based on the input data
   */
  redraw() {
    debugLog('ForceHorseViewer:redraw');

    this.initLayout();
    this.initChargeForce();
    this.draw();
    this.onSelectOutside();
    this.restartForceSimulation();
    this.requestRender();

    this.readyEvent.emit();
  }

  /**
   * Creates a random viewer name from the given alphabet
   */
  createInstanceName() {
    debugLog('ForceHorseViewer:createInstanceName');

    this.instanceName = Array.from(new Array(FHConfig.INSTANCE_NAME_LENGTH))
      .map(() => FHConfig.ALPHABET.charAt(Math.floor(Math.random() * FHConfig.ALPHABET.length)))
      .join('');
  }

  /**
   * Graph initialization: add auxiliary properties and variables to the nodes array
   */
  processNodes() {
    debugLog('ForceHorseViewer:processNodes');

    this.nodesById = {};
    this.nodeDataArray.forEach((node, index) => {
      if (node.id === undefined) {
        node.id = index;
      }

      this.nodesById[node.id] = index;
      if (node.label === undefined) {
        node.label = String(node.id);
      }

      // Init node edgesWeight (will be further calculated in processEdges())
      node.edgesWeight = 0;
    });
  };

  /**
   * return the nodes connected by the given edge {source: ..., target: ...}
   */
  getEdgeNodes(edge) {
    debugLog('ForceHorseViewer:getEdgeNodes', edge);

    let sourceNode, targetNode;
    if (typeof edge.source === 'number') {
      sourceNode = this.nodeDataArray[edge.source];
      targetNode = this.nodeDataArray[edge.target];
    } else {
      sourceNode = edge.source;
      targetNode = edge.target;
    }

    return {
      source: sourceNode,
      target: targetNode
    };
  };

  /**
   * If the given node was orphan, and received a new edge,
   * remove orphan class from the node
   */
  checkIncrementedNodeIfWasOrphan(nodeToCheck) {
    debugLog('ForceHorseViewer:checkIncrementedNodeIfWasOrphan', nodeToCheck);

    if (nodeToCheck.edgesWeight === 0 && this.elements) {
      this.elements[FHConfig.NODES]
        .filter(node => node.id === nodeToCheck.id)
        .classed('filtered-orphan', false);

      this.labels
        .filter(node => node.id === nodeToCheck.id)
        .classed('filtered-orphan', false);
    }
  }

  /**
   * Increment the weights of the nodes, that are attached to the given edge.
   * Called when adding an edge to the graph.
   */
  incrementNodesWeightsForEdge(edge) {
    debugLog('ForceHorseViewer:incrementNodesWeightsForEdge', edge);

    const edgeNodes = this.getEdgeNodes(edge);

    this.checkIncrementedNodeIfWasOrphan(edgeNodes.source);

    edgeNodes.source.edgesWeight += edge.weight;
    this.checkIncrementedNodeIfWasOrphan(edgeNodes.target);

    edgeNodes.target.edgesWeight += edge.weight;
  };

  /**
   * Graph initialization: add auxiliary properties and variables to the edges array
   */
  processEdges() {
    debugLog('ForceHorseViewer:processEdges');

    this.edgesFromNodes = {};
    this.edgeDataArray.forEach((edge, index) => {
      if (edge.id === undefined) {
        edge.id = index;
      }

      // Get nodes data from nodes id's
      if (edge.sourceID === undefined) {
        edge.sourceID = edge.source;
      }
      edge.source = this.nodesById[edge.sourceID];

      if (edge.targetID === undefined) {
        edge.targetID = edge.target;
      }
      edge.target = this.nodesById[edge.targetID];

      // Update edge weight
      if (!edge.weight) {
        edge.weight = 1;
      }

      // Also update max weight for edges
      if (edge.weight > this.edgesFilteredByWeight.maxEdgeWeight) {
        this.edgesFilteredByWeight.maxEdgeWeight = edge.weight;
      }

      this.incrementNodesWeightsForEdge(edge);

      // Build an index to help handle the case of multiple edges between two nodes
      if (edge.sourceID !== undefined && edge.targetID !== undefined) {
        const sid = edge.sourceID;
        const tid = edge.targetID;
        const key = (sid < tid ? sid + ',' + tid : tid + ',' + sid);
        if (this.edgesFromNodes[key] === undefined) {
          this.edgesFromNodes[key] = [index];
          edge.multiIdx = 1;
        } else {
          edge.multiIdx = this.edgesFromNodes[key].push(index);
        }
        // Calculate base edge offset, from the index in the multiple-edges array:
        // 1 -> 0, 2 -> 2, 3-> -2, 4 -> 4, 5 -> -4, ...
        edge.basicOffset = (edge.multiIdx % 2 === 0 ? edge.multiIdx * FHConfig.DEFAULT_EDGE_WIDTH : (-edge.multiIdx + 1) * FHConfig.DEFAULT_EDGE_WIDTH);
      }
    });
  };

  /**
   * Process nodes and edges input data
   */
  processInputData() {
    debugLog('ForceHorseViewer:processInputData');

    // Process input data
    if (!(this.data instanceof Array)) {
      this.data = ForceHorseHelper.convertFileDataFormat(this.data);
    }

    this.element.data = this.data;

    this.nodeDataArray = this.data[FHConfig.NODES].data;
    this.processNodes();

    this.edgeDataArray = this.data[FHConfig.EDGES].data;
    this.edgesFilteredByWeight = {
      filteredEdges: [],
      currentWeightLevel: 1,
      selectedWeightLevel: 1,
      maxEdgeWeight: 1
    };
    this.processEdges();
  }

  /**
   * Some nodes-related fields
   */
  initNodeFields() {
    debugLog('ForceHorseViewer:initNodeFields');

    // The size (area) of the containing circle
    this.numOfNodes = this.nodeDataArray.length;
    this.nodeIconAreaDefault = FHConfig.INNER_SVG_WIDTH / 54 * FHConfig.INNER_SVG_HEIGHT / 48 * 2;
    this.nodeIconRadius = Math.sqrt(this.nodeIconAreaDefault / Math.PI);
    this.selectedItems = [new Set(), new Set()]; // selected nodes, selected edges
    this.fixedNodesMode = false;
    this.isFirstZoomDone = false; // Zooming to viewport after first simlation
    this.isDragging = false;
  }

  /**
   * Set config parameters, which may be overwritten by the config argument
   * (that is, in fact, by an external json file)
   * @param config an external configuration object (typically from a json file)
   */
  setConfig(config = {}) {
    debugLog('ForceHorseViewer:setConfig');

    this.config = {
      showButtons: true,
      showLabels: true,
      numOfLabelsToShow: FHConfig.DEFAULT_NUM_OF_LABELS_TO_SHOW,
      showNodeWeight: true,
      showEdgeWeight: true,
      hideOrphanNodes: false,
      showFilterButton: true,
      showLabelsButton: true,
      showNodeWeightButton: true,
      showEdgeWeightButton: true,
      showOrphanNodesButton: true,
      forceParameters: {
        // TODO comment these parameters
        friction: 0.5,
        charge: -100,
        linkStrength: 1,
        gravity: 0.3,
        linkDistance: 10
      }
    };
    Object.assign(this.config, config);
  }

  /**
   * Set the force and friction
   */
  setForce() {
    debugLog('ForceHorseViewer:setForce');

    // Create a forceLayout viewer
    this.force = d3.forceSimulation().stop();

    let p;

    // Center-around force
    const forceCenter = d3.forceCenter(FHConfig.INNER_SVG_WIDTH / 2, FHConfig.INNER_SVG_HEIGHT / 2);
    this.force.force('center', forceCenter);

    // (Center-towards) positioning forces
    let forceX = d3.forceX(FHConfig.INNER_SVG_WIDTH / 2),
      forceY = d3.forceY(FHConfig.INNER_SVG_HEIGHT / 2);

    if ((p = this.config.forceParameters.gravity) !== undefined) {
      forceX.strength(p);
      forceY.strength(p);
    }

    this.force.force('forceX', forceX);
    this.force.force('forceY', forceY);

    // Friction
    if ((p = this.config.forceParameters.friction) === undefined) {
      p = ForceHorseHelper.computeFrictionParameter(FHConfig.INNER_SVG_WIDTH, FHConfig.INNER_SVG_HEIGHT, this.nodeDataArray.length);
    }
    this.force.velocityDecay(p);

    // Add nodes to the simulation
    this.force.nodes(this.nodeDataArray);

    // Add links (with link force) to the simulation
    const linkForce = d3.forceLink(this.edgeDataArray).id((_, i) => i);
    if ((p = this.config.forceParameters.linkDistance) !== undefined) {
      linkForce.distance(p);
    }
    if ((p = this.config.forceParameters.linkStrength) !== undefined) {
      linkForce.strength(p);
    }
    this.force.force('link', linkForce);
  }


  /**
   * Called when an element is meant to be selected inside this component.
   * @param item The data object bound to the selected element
   * @param element The DOM element
   * @param {boolean|null} on Select or Unselect
   * @param {boolean} clearOldSelection whether to clear first the current selection
   */
  onSelectInside(element, item, on, clearOldSelection) {
    if (clearOldSelection) {
      for (let itemType = FHConfig.NODES; itemType <= FHConfig.EDGES; itemType++) {
        this.elements[itemType]
          .filter((d) => this.selectedItems[itemType].has(d.id))
          .classed('selected', (d) => d.selected = false);
        this.selectedItems[itemType].clear();
      }
    }

    // Update the DOM element
    if (element) {
      console.log(element);
      d3.select(element).classed('selected', item.selected = on);
    }

    // Update the labels
    this.labels.classed('selected', (d) => d.selected);

    // Update the selectedItems set
    if (item) {
      const itemType = (item.class === FHConfig.CLASS_NODE ? FHConfig.NODES : FHConfig.EDGES);
      if (item.selected) {
        this.selectedItems[itemType].add(item.id);
      } else {
        this.selectedItems[itemType].delete(item.id);
      }

      const selectedItems = this.elements[itemType]
        .filter((d) => this.selectedItems[itemType].has(d.id));

      this.selectEvent.emit(selectedItems, !clearOldSelection, element, item);
    }

    // In "selectionMode" the unselected nodes are visually marked
    this.svg.classed('selectionMode', Boolean(this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size));
  };

  /**
   * Event handler. on a click not on a node or edge
   * Cancel current selection
   */
  onContainerClick() {
    debugLog('ForceHorseViewer:onContainerClick');

    if (this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size > 0) {
      this.onSelectInside(null, null, null, true);
    }
  };

  /**
   * Create the main SVG (canvas).
   * If that element exists, remove it first.
   * TODO - is the element really filtered from memory (and not just the DOM)?
   */
  initCanvas() {
    debugLog('ForceHorseViewer:initCanvas');

    d3.select(this.element)
      .select('div.svgWrapper')
      .remove();
    this.svg = d3.select(this.element)
      .append('div')
      .attr('class', 'svgWrapper')
      .append('svg')
      .attr('class', 'graph-svg')
      .attr('viewBox', '0 0 ' + FHConfig.INNER_SVG_WIDTH + ' ' + FHConfig.INNER_SVG_HEIGHT)
      .attr('preserveAspectRatio', 'none')
      .on('click', this.onContainerClick.bind(this))
      .call(this.zoom); // Todo: zoom.event replacement?
  }

  /**
   * Set SVG groups, and through them default colors,
   * for nodes and edges (note: the edge group has to be inserted first, so that the nodes will render above the edges).
   */
  setSVGGroups() {
    debugLog('ForceHorseViewer:setSVGGroups');

    this.edgeGroup = this.inSvgWrapper.append('g')
      .attr('class', 'edges')
      .attr('stroke', FHConfig.DEFAULT_EDGE_COLOR)
      .attr('stroke-width', FHConfig.DEFAULT_EDGE_WIDTH + 'px');
    this.nodeGroup = this.inSvgWrapper.append('g')
      .attr('class', 'nodes')
      .attr('fill', FHConfig.DEFAULT_NODE_COLOR)
      .attr('stroke', FHConfig.DEFAULT_NODE_COLOR);
    this.labelGroup = this.inSvgWrapper.append('g')
      .attr('class', 'labels')
      .attr('fill', FHConfig.DEFAULT_NODE_COLOR)
      .classed('display_none', !this.config.showLabels);
  }

  /**
   * Update level of details (after pan/zoom)
   */
  levelOfDetails() {
    debugLog('ForceHorseViewer:levelOfDetails');

    const view = this.svg.node().getBoundingClientRect(),
      nodesInView = [],
      startTime = now();

    let count = 0;

    // Find which nodes are contained in current view
    this.elements[FHConfig.NODES].each(function (d) { // Requires ES5 function for 'this' reference
      if (ForceHorseHelper.rectContained(this.getBoundingClientRect(), view)) {
        nodesInView[count++] = d;
      }
    });

    let numOfLabelsToShow = this.config.numOfLabelsToShow;
    // Experiment: show labels for 1/4 of the nodes in view
    numOfLabelsToShow = count < 2 * this.config.numOfLabelsToShow ? this.config.numOfLabelsToShow : Math.round(count / 4);
    // Sort the contained nodes, according to node weight
    // Set hide-on-current-level flag, for each node in view
    nodesInView.sort((node1, node2) => node1.edgesWeight - node2.edgesWeight)
      .forEach((node, i) => node.hideOnCurrentLevel = i < (count - numOfLabelsToShow));

    // Set label elements classes, according to these flags
    this.labels.classed('hide-on-current-level', (d) => d.hideOnCurrentLevel);

    debugLog('ForceHorseViewer:levelOfDetails:duration', (now() - startTime).toFixed(3));
  }

  /**
   * Perform pan/zoom
   */
  onZoom() {
    debugLog('ForceHorseViewer:onZoom');

    const trans = d3.event.transform;

    if (this.inSvgWrapper) {
      this.inSvgWrapper.attr('transform', `translate(${trans.x}, ${trans.y}) scale(${trans.k})`);
    }
  }

  /**
   * end of pan/zoom gesture
   */
  onZoomEnd() {
    debugLog('ForceHorseViewer:onZoomEnd');

    this.levelOfDetails();
  };


  /**
   * Node-dragging event handler
   * @param d The data item bound to the dragged node
   */
  onDrag(d) {
    // Fix the dragged node (not moved by the simulation)
    // d3 v4 style: node properties d.fx, d.fy instead of d.fixed in v3
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    if (!this.isDragging) {
      debugLog('drag detected');
      this.isDragging = true;
      this.restartForceSimulation();
    }
  }

  /**
   * Event handler, called when a node-dragging ends
   */
  onDragEnd() {
    this.isDragging = false;
    // Cool the simulation
    this.force.alpha(this.force.alphaMin());
  }

  /**
   * Init force layout & SVG
   * @param config an external configuration object (typically from a json file)
   */
  initLayout() {
    debugLog('ForceHorseViewer:initLayout');

    this.createInstanceName();

    this.processInputData();

    this.initNodeFields();

    this.setForce();

    this.zoom = d3.zoom()
      .scaleExtent([FHConfig.MAX_ZOOM, FHConfig.MIN_ZOOM])
      .on('zoom', this.onZoom.bind(this))
      .on('end', this.onZoomEnd.bind(this));

    this.initCanvas();

    // Set wrapper group, to use for pan & zoom transforms
    this.inSvgWrapper = this.svg.append('g');

    this.setSVGGroups();


    // Set dragging behavior
    this.drag = d3.drag()
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this));
  }

  /**
   * Recalculate (repelling) charge forces to the simulation
   */
  recalcChargeForces() {
    debugLog('ForceHorseViewer:recalcChargeForces');

    let charge, distanceMax;
    const chargeForce = this.force.force('charge');

    if (this.numOfNodes < FHConfig.HEAVY_SIMULATION_NUM_OF_NODES) {
      charge = (d) => d.edgesWeight * FHConfig.DEFAULT_CHARGE_LIGHT;
      distanceMax = FHConfig.CHARGE_DISTANCE_MAX_LIGHT;
    } else {
      charge = FHConfig.DEFAULT_CHARGE_HEAVY;
    }
    chargeForce.strength(charge);
    if (distanceMax) {
      chargeForce.distanceMax(distanceMax);
    }
  }

  /**
   * Add (repelling) charge forces to the simulation
   */
  initChargeForce() {
    debugLog('ForceHorseViewer:initChargeForce');

    this.force.force('charge', d3.forceManyBody());
    this.recalcChargeForces();
  }

  /**
   * An element was hovered inside this component.
   * @param item A data object
   * @param element The corresponding DOM element
   * @param {boolean} on
   */
  onHoverInside(element, item, on) {
    debugLog('ForceHorseViewer:onHoverInside', element, item, on);

    d3.select(element).classed('hovered', item.hovered = on);
    this.hoverEvent.emit(item, on);
  }

  /**
   * An element was hovered outside this component.
   * @param item data object of the hovered element
   */
  onHoverOutside(item) {
    debugLog('ForceHorseViewer:onHoverOutside', item);

    const itemType = (item.class === FHConfig.CLASS_NODE ? FHConfig.NODES : FHConfig.EDGES);
    this.elements[itemType]
      .filter((d) => d.id === item.id)
      .classed('hovered', item.hovered);
  }

  /**
   * Calculates the desired edge width (with or without showing weight)
   */
  getEdgeWidth(edgeData) {
    debugLog('ForceHorseViewer:getEdgeWidth', edgeData);

    return FHConfig.DEFAULT_EDGE_WIDTH + (edgeData.weight / 3) + 'px';
  }

  /**
   * Event handler. called when an element is clicked on
   */
  onClick(item, element) {
    debugLog('ForceHorseViewer:onClick', item, element);

    // Ignore the click event at the end of a drag
    if (!d3.event.defaultPrevented) {
      // If the Ctrl key was pressed during the click ..
      // If the clicked element was marked as selected, unselect it, and vice versa
      if (d3.event.ctrlKey) {
        this.onSelectInside(element, item, !item.selected);
      } else {
        // If the Ctrl key was not pressed ..
        // If the clicked element is selected, unselect the other elements
        // (if only the clicked element is selected, unselect it)
        // Else, clear the current selection, and select the clicked element
        if (item.selected && (this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size) === 1) {
          this.onSelectInside(element, item, false);
        } else {
          this.onSelectInside(element, item, true, true);
        }
      }
    }
    // Prevent bubbling, so that we can separately detect a click on the container
    d3.event.stopPropagation();
  }

  drawEdges() {
    debugLog('ForceHorseViewer:drawEdges');

    const self = this;

    this.elements[FHConfig.EDGES] = this.edgeGroup.selectAll('.' + FHConfig.CSS_CLASS_EDGE)
      .data(this.edgeDataArray)
      .enter()
      .append('line')
      .attr('class', FHConfig.CSS_CLASS_EDGE)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (!this.config.showEdgeWeight ? null : (d) => this.getEdgeWidth(d)))
      .on('mouseenter', function (d) {
        self.onHoverInside(this, d, true);
      })
      .on('mouseleave', function (d) {
        self.onHoverInside(this, d, false);
      })
      .on('click', function (d) {
        self.onClick(d, this);
      })
      // Prevent panning when dragging a node
      .on('mousedown', () => d3.event.stopPropagation());
  }

  drawNodes() {
    debugLog('ForceHorseViewer:drawNodes');

    const self = this;

    this.elements[FHConfig.NODES] = this.nodeGroup.selectAll('.' + FHConfig.CSS_CLASS_NODE)
      .data(this.nodeDataArray)
      .enter()
      .append('g')
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.color)
      .attr('class', FHConfig.CSS_CLASS_NODE)
      .on('mouseenter', function (d) {
        self.onHoverInside(this, d, true);
      })
      .on('mouseleave', function (d) {
        self.onHoverInside(this, d, false);
      })
      .on('click', function (d) {
        self.onClick(d, this);
      })
      .on('dblclick', (d) => this.doubleClickEvent.emit(d))
      // Prevent panning when dragging a node
      .on('mousedown', () => d3.event.stopPropagation())
      .call(this.drag);

    this.elements[FHConfig.NODES]._groups[0].forEach(g => {
      const data = g.__data__;
      if (data.svg) {
        d3.select(g).html((d) => d.svg);
      } else {
        d3.select(g).append('path').attr('d', d3.symbol().type((d) => d.shape));
      }
    });
  }

  drawLabels() {
    debugLog('ForceHorseViewer:drawLabels');

    this.labels = this.labelGroup.selectAll('text.label')
      .data(this.nodeDataArray)
      .enter()
      .append('text')
      .attr('fill', (d) => d.color)
      .text((d) => d.label)
      .attr('text-anchor', (d) => (ForceHorseHelper.isHebrewString(d.label) ? 'end' : 'start'));
  }

  drawProgressBar() {
    debugLog('ForceHorseViewer:drawProgressBar');

    this.progressBar = this.svg
      .append('line')
      .attr('class', 'progress')
      .attr('x1', '0')
      .attr('y1', '1')
      .attr('x2', '0')
      .attr('y2', '1');
  }

  /**
   * Update the force simulation in the DOM
   */
  updateGraphInDOM() {
    debugLog('ForceHorseViewer:updateGraphInDOM');

    if (isNaN(this.fixAspectRatio)) {
      this.calcFixAspectRatio();
    }

    // Update nodes
    this.elements[FHConfig.NODES].attr('transform', (d) => {
      const scaleSize = Math.sqrt(this.getRequiredNodeIconSize(d) / this.nodeIconAreaDefault);
      return `translate(${d.x}, ${d.y}) scale(${this.fixAspectRatio * scaleSize}, ${scaleSize})`;
    });

    // Update labels
    this.labels
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('dx', (d) => (ForceHorseHelper.isHebrewString(d.label) ? -1 : +1) *
        (FHConfig.LABEL_DISPLACEMENT + 5 * (this.getRequiredNodeIconSize(d) / this.nodeIconAreaDefault)));

    // Update edges
    this.elements[FHConfig.EDGES]
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
      // Add some translation, for the case of multiple edges between two nodes
      .attr('transform', (d) => {
        const offset = ForceHorseHelper.calcRightAngledOffset(d.basicOffset, d.target.x - d.source.x, d.target.y - d.source.y);
        return 'translate(' + offset.dx + ', ' + offset.dy + ')';
      });
  }

  /**
   * Fix aspect ratios, when the window resize
   */
  onWindowResize() {
    debugLog('ForceHorseViewer:onWindowResize');

    this.calcFixAspectRatio();
    this.updateGraphInDOM();
  }

  /**
   * Set the graph in the DOM: nodes, edges, labels, progress bar
   */
  draw() {
    debugLog('ForceHorseViewer:draw');

    this.elements = new Array(2); // nodes, edges

    this.drawEdges();
    this.drawNodes();
    this.drawLabels();
    this.drawProgressBar();

    // set an on-resize event, to fix aspect ratios
    d3.select(window).on('resize.' + this.instanceName, this.onWindowResize.bind(this));
  }

  /**
   * Returns a number to be multiplied by an element's width, to fix aspect ratio deformation,
   * due to the svg fixAspectRatio="none"
   */
  calcFixAspectRatio() {
    debugLog('ForceHorseViewer:calcFixAspectRatio');

    const currentRect = this.svg._groups[0][0].getBoundingClientRect(), // Todo: use selection.node()
      currentHeight = currentRect.height,
      currentWidth = currentRect.width;
    this.fixAspectRatio = (FHConfig.INNER_SVG_WIDTH / FHConfig.INNER_SVG_HEIGHT) * (currentHeight / currentWidth);
    if (isNaN(this.fixAspectRatio)) {
      this.fixAspectRatio = 1;
    }
  }

  /**
   * Zoom out the graph, if needed, so that it is fully visible.
   */
  zoomToViewport() {
    debugLog('ForceHorseViewer:zoomToViewport');

    let scale, translate;
    const width = FHConfig.INNER_SVG_WIDTH,
      height = FHConfig.INNER_SVG_HEIGHT,
      radius = this.nodeIconRadius * 3, // a factor for some added margin
      maxMarginX = d3.max(this.nodeDataArray, (d) => Math.max(-d.x + radius, d.x + radius - width, 0)),
      maxMarginY = d3.max(this.nodeDataArray, (d) => Math.max(-d.y + radius, d.y + radius - height, 0));

    if (maxMarginX > 0 || maxMarginY > 0) {
      // If the graph (without the current zoom/pan) exceeds the view boundaries,
      // calculate the zoom/pan extent to return it to the viewport.
      let scaleX = width / (width + 2 * maxMarginX),
        scaleY = height / (height + 2 * maxMarginY);
      scale = Math.min(scaleX, scaleY) * 0.95;
      translate = [(width / 2) * (1 - scale), (height / 2) * (1 - scale)];
      // If the calculated zoom is bigger than the zoom limit, increase the limit
      if (scale < FHConfig.MAX_ZOOM) {
        this.zoom.scaleExtent([scale, FHConfig.MIN_ZOOM]);
      }
    } else {
      // If the graph, without the current zoom/pan, is within the view boundaries,
      // then simply reset the zoom/pan extent.
      scale = 1;
      translate = [0, 0];
    }

    this.svg.transition()
      .duration(FHConfig.ANIMATION_DURATION)
      .call(this.zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
  }

  /**
   * Called from Pause/Play button
   * Pause fixes all the nodes
   * Play unfixes all the nodes
   */
  toggleFixedNodesMode() {
    debugLog('ForceHorseViewer:toggleFixedNodesMode');

    if (this.fixedNodesMode) {
      this.elements[FHConfig.NODES].classed('fixed', (d) => {
        d.fx = null;
        d.fy = null;
        return false;
      });
      this.fixedNodesMode = false;
      this.restartForceSimulation();
    } else {
      this.elements[FHConfig.NODES].classed('fixed', (d) => {
        d.fx = d.x;
        d.fy = d.y;
        return true;
      });
      this.fixedNodesMode = true;
    }
  }

  /**
   * Called whenever the d3 force-simulation comes to a halt.
   */
  onForceEnd() {
    // Zoom out the graph, if needed, so that it is fully visible.
    // This is done only on the first time after component start.
    if (!this.isFirstZoomDone) {
      this.zoomToViewport();
      this.isFirstZoomDone = true;
      // Also make the graph fixed, after the first force-simulation
      this.toggleFixedNodesMode();
      this.requestRender(); // To update the related button's display
    }
  };

  /**
   * Update the progress bar
   */
  updateProgressBar() {
    // Do not update progress bar in fixed nodes mode
    if (!this.fixedNodesMode) {
      const ratio = (1 - (this.force.alpha() - this.force.alphaMin()) / FHConfig.MAX_ALPHA);
      this.progressBar.attr('x2', (ratio === 1) ? 0 : ratio * FHConfig.INNER_SVG_WIDTH);
    }
  };

  /**
   * Run the force-simulation with control.
   * The DOM is not updated for every tick.
   */
  runSimulation() {
    const simulationStart = now();
    let ticksPerRender,
      simulationDuration, calculationStart, calculationDuration = 0,
      ticks = 0;

    this.force.velocityDecay(FHConfig.VELOCITY_DECAY_LIGHT);

    const render = () => {
      // Do not accelerate the simulation during dragging, so as not to slow the dragging.
      ticksPerRender = (this.isDragging ? 1 : this.numOfNodes / 7);
      calculationStart = now();
      for (let i = 0; i < ticksPerRender && this.force.alpha() > this.force.alphaMin(); i++) {
        this.force.tick();
        ticks++;
      }
      calculationDuration += (now() - calculationStart);
      this.updateGraphInDOM();
      this.updateProgressBar();

      if (this.force.alpha() > this.force.alphaMin()) {
        requestAnimationFrame(render);
      } else {
        simulationDuration = now() - simulationStart;
        debugLog(`Force Simulation time = ${(simulationDuration / 1000).toFixed(2)}s, Calculation time =  ${(calculationDuration / 1000).toFixed(2)}s, ${ticks} ticks`);
        this.onForceEnd();
      }
    };

    requestAnimationFrame(render);
  }

  /**
   * Heavy graphs version: run the force-simulation with control.
   * The DOM is not updated for every tick.
   */
  runHeavySimulation() {
    let ticksPerRender,
      calculationStart, calculationDuration = 0,
      ticks = 0;

    let render = () => {
      // Do not accelerate the simulation during dragging, so as not to slow the dragging.
      ticksPerRender = (this.isDragging ? 1 : 30);
      calculationStart = now();
      for (let i = 0; i < ticksPerRender && this.force.alpha() > this.force.alphaMin(); i++) {
        this.force.tick();
        ticks++;
      }
      calculationDuration += (now() - calculationStart);
      this.updateProgressBar();
      if (this.isDragging) {
        this.updateGraphInDOM();
      }

      if (this.force.alpha() > this.force.alphaMin()) {
        requestAnimationFrame(render);
      } else {
        debugLog(`Calculation time =  ${(calculationDuration).toFixed(3)}s, ${ticks} ticks`);
        this.updateGraphInDOM();
        this.onForceEnd();
      }
    };

    requestAnimationFrame(render);
  }

  /**
   * Called when a force-simulation is supposed to start.
   */
  onForceStart() {
    debugLog('ForceHorseViewer:onForceStart');

    this.calcFixAspectRatio();

    if (this.numOfNodes < FHConfig.HEAVY_SIMULATION_NUM_OF_NODES) {
      this.runSimulation();
    } else {
      this.runHeavySimulation();
    }
  }

  /**
   * Restart the force simulation
   */
  restartForceSimulation() {
    debugLog('ForceHorseViewer:restartForceSimulation');

    this.force.alpha(FHConfig.MAX_ALPHA);
    this.onForceStart();
  };

  /**
   * Calculates the required node icon area
   * @param nodeData
   */
  getRequiredNodeIconSize(nodeData) {
    debugLog('ForceHorseViewer:getRequiredNodeIconSize', nodeData);

    return this.nodeIconAreaDefault +
      (this.config.showNodeWeight ? nodeData.edgesWeight * FHConfig.node_size_addition_per_weight_unit : 0);
  }

  /**
   * If the given node is orphan, then if the component is in
   * orphan hiding state, then hide the node; else un-hide the node
   */
  checkNodeIfOrphan(nodeToCheck) {
    if (nodeToCheck.edgesWeight === 0) {
      this.elements[FHConfig.NODES]
        .filter(node => node.id === nodeToCheck.id)
        .classed('filtered-orphan', this.config.hideOrphanNodes);
      this.labels
        .filter(node => node.id === nodeToCheck.id)
        .classed('filtered-orphan', this.config.hideOrphanNodes);
    }
  }

  /**
   * decrement the weights of the nodes, that are attached to the given edge.
   * Called when filtering an edge from the graph.
   */
  decrementNodesWeightsForFilteredEdge(edge) {
    debugLog('ForceHorseViewer:decrementNodesWeightsForFilteredEdge', edge);

    const edgeNodes = this.getEdgeNodes(edge);
    edgeNodes.source.edgesWeight -= edge.weight;
    this.checkNodeIfOrphan(edgeNodes.source);
    edgeNodes.target.edgesWeight -= edge.weight;
    this.checkNodeIfOrphan(edgeNodes.target);
  }

  /**
   * Filter button action: remove selected elements
   */
  onFilterInside() {
    debugLog('ForceHorseViewer:onFilterInside');

    // Mark the selected items as filtered, and deselect them
    // Also clear the selected-items sets
    for (let itemType = FHConfig.NODES; itemType <= FHConfig.EDGES; itemType++) {
      this.elements[itemType]
        .filter(item => item.selected)
        .each(item => {
          item.filtered = true;
          item.selected = false;
          if (itemType == FHConfig.EDGES) {
            this.decrementNodesWeightsForFilteredEdge(item);
          }
        })
        .classed('filtered', true)
        .classed('selected', false);
      this.selectedItems[itemType].clear();
    }

    // Remove the labels of filtered nodes
    this.labels.classed('selected', false).classed('filtered', associatedNode => associatedNode.filtered);

    // Remove edges connected to filtered nodes
    this.elements[FHConfig.EDGES]
      .filter(edge => edge.source.filtered || edge.target.filtered)
      .each(edge => {
        edge.filtered = true;
        this.decrementNodesWeightsForFilteredEdge(edge);
      })
      .classed('filtered', true);

    // Cancel selection mode
    this.svg.classed('selectionMode', false);

    // Broadcast event
    this.filterEvent.emit();
  }

  /**
   * API: some elements were filtered out, update the graph
   */
  onFilterOutside() {
    debugLog('ForceHorseViewer:onFilterOutside');

    // Give the filtered elements the approprite CSS class
    // If a filtered element was selected, mark it as unselected
    for (let itemType = FHConfig.NODES; itemType <= FHConfig.EDGES; itemType++) {
      this.elements[itemType]
        .filter(item => item.filtered)
        .classed('filtered', true)
        .classed('selected', false)
        .each(item => {
          let type = (item.class === FHConfig.CLASS_NODE ? FHConfig.NODES : FHConfig.EDGES);
          this.selectedItems[type].delete(item.id);
          if (type === FHConfig.EDGES) {
            this.decrementNodesWeightsForFilteredEdge(item);
          }
        });
    }

    // Remove the labels of filtered nodes
    this.labels
      .filter(item => item.filtered)
      .classed('filtered', true)
      .classed('selected', false);

    // Remove edges connected to filtered nodes
    this.elements[FHConfig.EDGES]
      .filter(edge => edge.source.filtered || edge.target.filtered)
      .each(edge => {
        edge.filtered = true;
        this.decrementNodesWeightsForFilteredEdge(edge);
      })
      .classed('filtered', true);

    // Update visual selection mode
    this.svg.classed('selectionMode',
      this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size);
  }

  /**
   * Event handler. on a click not on a node or edge
   * Cancel current selection
   */
  onContainerClick() {
    debugLog('ForceHorseViewer:onContainerClick');

    if (this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size > 0) {
      this.onSelectInside(null, null, null, true);
    }
  }

  /**
   * Cancel Timeout Click counter
   */
  cancelDblClickTimer() {
    clearTimeout(this.dblClickTimer);
    this.dblClickTimer = undefined;
  }

  /**
   * @ngdoc method
   * @name forceHorse.factory:ForceHorseFactory#onSelectOutside
   * @description
   * API: Called when elements were selected and/or unselected outside this component.
   * @returns {ForceHorseFactory} current viewer
   */
  onSelectOutside() {
    // Update the "selected" css class, and the selected-items sets
    for (let itemType = FHConfig.NODES; itemType <= FHConfig.EDGES; itemType++) {
      const mySet = this.selectedItems[itemType];
      mySet.clear();
      this.elements[itemType]
        .classed('selected', (d) => {
          if (d.selected) {
            mySet.add(d.id);
            return true;
          } else {
            return false;
          }
        });
    }

    // Update the labels
    this.labels.classed('selected', (d) => d.selected);

    // In "selectionMode" the unselected nodes are visually marked
    this.svg.classed('selectionMode',
      this.selectedItems[FHConfig.NODES].size + this.selectedItems[FHConfig.EDGES].size);
  }

  /**
   * Show or hide labels
   * Called when the labels button is clicked on
   */
  onLabelsShowHideBtnClick() {
    if (this.config.showLabels = !this.config.showLabels) {
      this.labelGroup.classed('display_none', false);
    } else { // show labels
      this.labelGroup.classed('display_none', true);
    }
  }

  /**
   * Show or hide node weights
   * Called when the node weight button is clicked on
   */
  onNodeWeightShowHideBtnClick() {
    this.config.showNodeWeight = !this.config.showNodeWeight;
    this.updateGraphInDOM();
  }

  /**
   * Show or hide orphan nodes
   * Called when the orphan nodes button is clicked on
   */
  onOrphanNodesShowHideBtnClick() {
    this.config.hideOrphanNodes = !this.config.hideOrphanNodes;
    this.elements[FHConfig.NODES]
      .filter(node => node.edgesWeight === 0)
      .classed('filtered-orphan', this.config.hideOrphanNodes);
    this.labels
      .filter(node => node.edgesWeight === 0)
      .classed('filtered-orphan', this.config.hideOrphanNodes);
  }

  /**
   * Show or hide edge weights
   * Called when the edge weight button is clicked on
   */
  onEdgeWeightShowHideBtnClick() {
    this.config.showEdgeWeight = !this.config.showEdgeWeight;
    this.elements[FHConfig.EDGES]
      .attr('stroke-width', (!this.config.showEdgeWeight ? null : (d) => this.getEdgeWidth(d)));
  }

  /**
   * Filter or un-filter edges according to the selected weight level (slider)
   */
  onEdgesSelectedWeightLevelChange() {
    if (this.edgesFilteredByWeight.currentWeightLevel < this.edgesFilteredByWeight.selectedWeightLevel) {
      // filter some edges
      this.elements[FHConfig.EDGES]
        .filter(edge => edge.weight >= this.edgesFilteredByWeight.currentWeightLevel
          && edge.weight < this.edgesFilteredByWeight.selectedWeightLevel)
        .each(edge => {
          edge.filteredByWeight = true;
          this.decrementNodesWeightsForFilteredEdge(edge);
        })
        .classed('filtered-low-weight', true);
    } else {
      // un-filter some edges
      this.elements[FHConfig.EDGES]
        .filter(edge => edge.weight >= this.edgesFilteredByWeight.selectedWeightLevel
          && edge.weight < this.edgesFilteredByWeight.currentWeightLevel)
        .each(edge => {
          edge.filteredByWeight = false;
          this.incrementNodesWeightsForEdge(edge);
        })
        .classed('filtered-low-weight', false);
    }
    this.edgesFilteredByWeight.currentWeightLevel = this.edgesFilteredByWeight.selectedWeightLevel;
  }
}