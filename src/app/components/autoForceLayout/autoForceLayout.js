"use strict";
//===============================================================//
// define the autoForceLayout module

angular.module('autoForceLayout', [])

    //---------------------------------------------------------------//
    .run(function ($templateCache) {
        // cache our buttons template
        $templateCache.put('autoForceLayout/buttons',
            '<div class="buttonsWrapper" layout="row" layout-align="start center">\
              <span flex="10"></span>\
              <span flex="40">\
                <i class="mdi mdi-filter"\
                   title="Filter"\
                   ng-click="autoForceLayoutInstance.removeSelectedElements()"></i>\
                <i class="mdi mdi-wrap"\
                   title="Find shortest path"></i>\
                <i class="mdi"\
                   title="Fix/release nodes"\
                   ng-class="autoForceLayoutInstance.fixedNodesMode ? \'mdi-play-circle-outline\' : \'mdi-pause-circle-outline\'" \
                   ng-click="autoForceLayoutInstance.onPlayPauseBtnClick()"></i>\
              </span>\
              <span flex>\
                <i class="mdi"\
                   title="Hide/show labels"\
                   ng-class="autoForceLayoutInstance.config.hideLabels ? \'mdi-label\' : \'mdi-label-outline\'" \
                   ng-click="autoForceLayoutInstance.onLabelsShowHideBtnClick()"></i>\
                <i class="mdi mdi-minus"\
                   title="Show/hide edge weight"\
                   ng-click="autoForceLayoutInstance.onEdgeWeightShowHideBtnClick()"></i>\
                <i class="mdi mdi-regex"\
                   title="Show/hide node weight"\
                   ng-click="autoForceLayoutInstance.onNodeWeightShowHideBtnClick()"></i>\
              </span>\
            </div>');
    })

    //---------------------------------------------------------------//
    .directive('autoForceLayout', ['$compile', 'AutoForceLayoutFactory', 'AutoForceLayoutHelper', function ($compile, AutoForceLayoutFactory, helper) {
        return {
            restrict: "EA",
            controllerAs: "autoForceLayoutCtrl",
            priority: 100,
            scope: {
                options: "=",
                onHover: '&',
                onSelect: '&'
            },
            bindToController: true,
            controller: function ($scope, $element) {
                //console.log('In autoForceLayout controller');

                this.externalEventHandlers = helper.applyScopeToEventHandlers(this, $scope);
                // Create my instance
                // Also provide the caller with a reference to my instance, for API
                this.options.autoForceLayoutInstance =
                    $scope.autoForceLayoutInstance = new AutoForceLayoutFactory($element, this.options, this.externalEventHandlers)
                        .redraw();
            },
            link: function (scope, element) { //, attr, ctrl) {
                //console.log('In autoForceLayout link');

                // Add CSS class to set a CSS "namespace"
                element.addClass("auto-force-layout");
                // Add flex-box properties
                element.attr("layout", "column");
                element.attr("flex", "");
                // Add button bar
                helper.addButtons(scope, element);
            }
        };
    }])

    //---------------------------------------------------------------//
    .factory('AutoForceLayoutFactory', ['AutoForceLayoutConstants', 'AutoForceLayoutHelper', function (constants, helper) {
        // constructor
        function AutoForceLayoutFactory(element, options, externalEventHandlers) {
            this.element = element[0];
            this.options = options;
            this.externalEventHandlers = externalEventHandlers;

        }

        var proto = AutoForceLayoutFactory.prototype;

        //---------------------------------------------------
        // redraw
        // Recreate the graph
        // To be called whenever elements are added or
        // removed from the graph data
        //---------------------------------------------------
        proto.redraw = function () {
            var myInstance = this;
            d3.json("autoForceLayout.json", function (error, json) {
                if (error) {
                    console.warn(error);
                    json = {};
                }
                myInstance.initLayout(json);
                myInstance.draw();
            });
            return this;
        };

        //---------------------------------------------------
        // initLayout
        // Init force layout & SVG
        // Parameters: config: an external configration object
        // (typically from a json file)
        //---------------------------------------------------
        proto.initLayout = function (config) {
            var myInstance = this;

            // Process input data
            this.nodeDataArray = this.options.data[constants.NODES].data;
            this.edgeDataArray = this.options.data[constants.EDGES].data;
            this.processNodes();
            this.processEdges();

            // Some nodes-related fields
            // The size (area) of the containing circle
            this.nodeIconAreaDefault = constants.INNER_SVG_WIDTH / 64 * constants.INNER_SVG_HEIGHT / 48 * 2;
            this.nodeIconRadius = Math.sqrt(this.nodeIconAreaDefault / Math.PI);
            this.selectedItems = [new Set(), new Set()]; // selected nodes, selected edges
            this.fixedNodesMode = false;
            this.isBoundedGraphMode = false; // TODO: redundant?
            this.isFirstZoomDone = false; // See onForceEnd()

            // Set config parameters, which may be overwritten by the config argument
            this.config = {
                hideLabels: false,
                showNodeWeight: false,
                showEdgeWeight: false,
                forceParameters: {
                    // New parameters
                    charge: -350,
                    linkStrength: 1,
                    gravity: 0.3,
                    linkDistance: 10
                    // Old parameters
                    //charge: -400,
                    //linkDistance: 40
                }
            };
            Object.assign(this.config, config); // Transfer properties, ES6 style
            //for (let key in config) {
            //    if (config.hasOwnProperty(key)) {
            //        myInstance.config[key] = config[key];
            //    }
            //}

            // Create a forceLayout instance
            myInstance.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .on("tick", function () {
                    myInstance.onTick();
                })
                .on("end", function () {
                    myInstance.onForceEnd();
                });
            var p;
            if (angular.isDefined(p = myInstance.config.forceParameters.linkDistance)) myInstance.force.linkDistance(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.linkStrength)) myInstance.force.linkStrength(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.charge)) myInstance.force.charge(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.gravity)) myInstance.force.gravity(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.friction)) {
                myInstance.force.friction(p);
            } else {
                myInstance.force.friction(helper.computeFrictionParameter(constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT, this.nodeDataArray.length))
            }

            myInstance.drag = myInstance.force.drag()
                .on("drag", function (d) {
                    myInstance.onDrag(d);
                });

            myInstance.force.nodes(myInstance.nodeDataArray)
                .links(this.edgeDataArray)
                .start();

            myInstance.zoom = d3.behavior.zoom()
                .scaleExtent([constants.MAX_ZOOM, constants.MIN_ZOOM])
                .on("zoom", function () {
                    myInstance.onZoom();
                });

            // Create the main SVG (canvas).
            // If that element exists, remove it first.
            // TODO - is the element really removed from memory (and not just the DOM)?
            d3.select(myInstance.element)
                .select("div.svgWrapper")
                .remove();
            myInstance.svg = d3.select(myInstance.element)
                .append("div")
                .attr("class", "svgWrapper")
                .append("svg")
                .attr("class", "graph-svg")
                .attr("viewBox", "0 0 " + constants.INNER_SVG_WIDTH + " " + constants.INNER_SVG_HEIGHT)
                .attr("preserveAspectRatio", "none")
                .on("click", function () {
                    myInstance.onContainerClick()
                })
                .call(myInstance.zoom)
                .call(myInstance.zoom.event) // Used in zoomToViewport()
            ;

            // Set wrapper group, to use for pan & zoom transforms
            myInstance.inSvgWrapper = myInstance.svg.append("g");

            // Set SVG groups, and through them default colors,
            // for nodes and edges (note: the edge group has to be inserted first, so that the nodes
            // will render above the edges).
            myInstance.edgeGroup = myInstance.inSvgWrapper.append("g")
                .attr("class", "edges")
                .attr("stroke", "lightgray")
                .attr("stroke-width", constants.DEFAULT_LINE_WIDTH + 'px');
            myInstance.nodeGroup = myInstance.inSvgWrapper.append("g")
                .attr("class", "nodes")
                .attr("fill", "lightgray");
            myInstance.labelGroup = myInstance.inSvgWrapper.append("g")
                .attr("class", "labels")
                .classed("display_none", myInstance.config.hideLabels);

            return myInstance;
        }; // initLayout()

        //---------------------------------------------------
        // draw
        // Draw the graph: nodes, edges, labels
        //---------------------------------------------------
        proto.draw = function () {
            //console.log('in redraw()');
            var myInstance = this;
            myInstance.elements = new Array(2); // nodes, edges

            // draw edges
            this.elements[constants.EDGES] = this.edgeGroup.selectAll("." + constants.CSS_CLASS_EDGE)
                .data(this.edgeDataArray)
                .enter()
                .append("line")
                .attr("class", constants.CSS_CLASS_EDGE)
                .attr("stroke", function (d) {
                    return d.color;
                })
                .attr("stroke-width", (!this.config.showEdgeWeight ? null : function (d) {
                    return myInstance.getEdgeWidth(d);
                }))
                .on("mouseenter", function (d) {
                    myInstance.onHoverInside(this, d, true);
                })
                .on("mouseleave", function (d) {
                    myInstance.onHoverInside(this, d, false);
                })
                .on("click", function (d) {
                    myInstance.onClick(d, this);
                })
                // Prevent panning when dragging a node
                .on("mousedown", function () {
                    d3.event.stopPropagation();
                })
            ;

            // draw nodes
            this.elements[constants.NODES] = this.nodeGroup.selectAll("." + constants.CSS_CLASS_NODE)
                .data(this.nodeDataArray)
                .enter()
                .append("path")
                // Set node shape & size
                .attr("d", d3.svg.symbol()
                    .type(function (d) {
                        return d.shape;
                    })
                    .size(function (d) {
                        return myInstance.getNodeIconArea(d);
                    }))
                .attr("class", constants.CSS_CLASS_NODE)
                .attr("fill", function (d) {
                    return d.color;
                })
                .on("mouseenter", function (d) {
                    myInstance.onHoverInside(this, d, true);
                })
                .on("mouseleave", function (d) {
                    myInstance.onHoverInside(this, d, false);
                })
                .on("click", function (d) {
                    myInstance.onClick(d, this);
                })
                // Prevent panning when dragging a node
                .on("mousedown", function () {
                    d3.event.stopPropagation();
                })
                .call(this.drag);

            // draw node labels
            this.labels = this.labelGroup.selectAll("text.label")
                .data(this.nodeDataArray)
                .enter()
                .append("text")
                .attr("fill", function (d) {
                    return d.color;
                })
                .attr("dx", "10") // displacement from the node
                .text(function (d) {
                    return d.label;
                });

            return this;
        };

        //---------------------------------------------------
        // getNodeIconArea
        //---------------------------------------------------
        proto.getNodeIconArea = function (nodeData) {
            var myInstance = this;
            return myInstance.nodeIconAreaDefault
                + (myInstance.config.showNodeWeight ? nodeData.weight * constants.NODE_SIZE_ADDITION_PER_WEIGHT_UNIT : 0);
        };

        //---------------------------------------------------
        // getEdgeWidth
        //---------------------------------------------------
        proto.getEdgeWidth = function (edgeData) {
            return constants.DEFAULT_LINE_WIDTH + (edgeData.weight / 4) + 'px';
        };

        //---------------------------------------------------
        // removeSelectedElements
        // "Filter" button action
        //---------------------------------------------------
        proto.removeSelectedElements = function () {
            // Does not seem an action for this component ..
        };

        //---------------------------------------------------
        // processNodes
        // Add references to the given nodes array
        //---------------------------------------------------
        proto.processNodes = function () {
            var myInstance = this;
            this.nodesById = {};
            this.nodeDataArray.forEach(function (val, idx) {
                if (typeof val.id === "undefined") {
                    console.error("Undefined [id] in nodes array");
                } else {
                    myInstance.nodesById[val.id] = idx;
                }
            });
        };

        //---------------------------------------------------
        // processEdges
        // Get nodes data from nodes id's
        // Build an index to help handle the case of multiple edges between two nodes
        //---------------------------------------------------
        proto.processEdges = function () {
            var myInstance = this, sid, tid, key;
            this.edgesFromNodes = {};
            this.edgeDataArray.forEach(function (val, idx) {
                if (angular.isUndefined(val.id)) {
                    // (Edges ids are not really needed, so I cancel the warning)
                    // console.warn(`Undefined [id] in edge ${val.sourceID} - ${val.targetID}`);
                }
                // Get nodes data from nodes id's
                if (angular.isUndefined(val.sourceID)) {
                    console.error("Undefined [sourceID] in edge #" + val.id);
                } else {
                    val.source = myInstance.nodesById[val.sourceID];
                }
                if (angular.isUndefined(val.targetID)) {
                    console.error("Undefined [targetID] in edges #" + val.id);
                } else {
                    val.target = myInstance.nodesById[val.targetID];
                }
                // Build an index to help handle the case of multiple edges between two nodes
                if (angular.isDefined(val.sourceID) && angular.isDefined(val.targetID)) {
                    sid = val.sourceID;
                    tid = val.targetID;
                    key = (sid < tid ? sid + "," + tid : tid + "," + sid);
                    if (angular.isUndefined(myInstance.edgesFromNodes[key])) {
                        myInstance.edgesFromNodes[key] = [idx];
                        val.multiIdx = 1;
                    } else {
                        val.multiIdx = myInstance.edgesFromNodes[key].push(idx);
                    }
                    // Calculate base edge offset, from the index in the multiple-edges array:
                    // 1 -> 0, 2 -> 2, 3-> -2, 4 -> 4, 5 -> -4, ...
                    val.basicOffset = (val.multiIdx % 2 === 0 ? val.multiIdx * constants.DEFAULT_LINE_WIDTH : (-val.multiIdx + 1) * constants.DEFAULT_LINE_WIDTH);
                }
            });
        };

        //---------------------------------------------------
        // onTick
        // Update the graph
        //---------------------------------------------------
        proto.onTick = function () {
            var myInstance = this;

            // Update nodes
            this.elements[constants.NODES].attr('transform', function (d) {
                if (myInstance.isBoundedGraphMode) {
                    // Force the nodes inside the visible area
                    var radius = myInstance.nodeIconRadius;
                    d.x = Math.max(radius, Math.min(constants.INNER_SVG_WIDTH - radius, d.x));
                    d.y = Math.max(radius, Math.min(constants.INNER_SVG_HEIGHT - radius, d.y));
                }
                return "translate(" + d.x + "," + d.y + ")";
            });

            // Update labels
            this.labels.attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                });

            // Update edges
            this.elements[constants.EDGES].attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                })
                // Add some translation, for the case of multiple edges between two nodes
                .attr('transform', function (d) {
                    var offset = helper.calcRightAngledOffset(d.basicOffset, d.target.x - d.source.x, d.target.y - d.source.y);
                    return "translate(" + offset.dx + "," + offset.dy + ")";
                })
            ;
        };

        //---------------------------------------------------
        // onForceEnd
        // Event handler, called whenever the d3 force-simulation
        // comes to a halt.
        //---------------------------------------------------
        proto.onForceEnd = function () {
            // Zoom out the graph, if needed, so that it is fully visible.
            // This is done only on the first time after component start.
            if (!this.isFirstZoomDone) {
                this.zoomToViewport();
                this.isFirstZoomDone = true;
            }
        };

        //---------------------------------------------------
        // zoomToViewport
        // Zoom out the graph, if needed, so that it is fully visible.
        //---------------------------------------------------
        proto.zoomToViewport = function () {
            var width = constants.INNER_SVG_WIDTH,
                height = constants.INNER_SVG_HEIGHT,
                radius = this.nodeIconRadius,
                maxMarginX = d3.max(this.nodeDataArray, function (d) {
                    return Math.max(-d.x + radius, d.x + radius - width, 0);
                }),
                maxMarginY = d3.max(this.nodeDataArray, function (d) {
                    return Math.max(-d.y + radius, d.y + radius - height, 0);
                });
            if (maxMarginX > 0 || maxMarginY > 0) {
                var scaleX = width / (width + 2 * maxMarginX),
                    scaleY = height / (height + 2 * maxMarginY),
                    scale = Math.min(scaleX, scaleY),
                    translate = [(width / 2) * (1 - scale), (height / 2) * (1 - scale)];
                // If the calculated zoom is bigger than the zoom limit, increase the limit
                if (scale < constants.MAX_ZOOM) {
                    this.zoom.scaleExtent([scale, constants.MIN_ZOOM]);
                }
                // Perform the zoom
                this.svg.transition()
                    .duration(constants.ZOOM_TRANSITION_DURATION_MS)
                    .call(this.zoom.translate(translate).scale(scale).event);
            }
        };

        //---------------------------------------------------
        // onClick
        // Event handler. Manage element selection
        //---------------------------------------------------
        proto.onClick = function (item, element) {
            // Ignore the click event at the end of a drag
            if (d3.event.defaultPrevented) return;
            // If the Ctrl key was pressed during the click ..
            // If the clicked element was marked as selected, unselect it, and vice versa
            if (d3.event.ctrlKey) {
                this.onSelectInside(element, item, !item.selected);
            } else {
                // If the Ctrl key was not pressed ..
                // If the clicked element is selected, unselect the other elements
                // Else, clear the current selection, and select the clicked element
                //if (!data.selected) {
                this.onSelectInside(element, item, true, true);
                //}
            }
            // Prevent bubbling, so that we can separately detect a click on the container
            d3.event.stopPropagation();
        };

        //---------------------------------------------------
        // onContainerClick
        // Event handler. on a click not on a node or edge
        // Cancel current selection
        //---------------------------------------------------
        proto.onContainerClick = function () {
            if (this.selectedItems[constants.NODES].size + this.selectedItems[constants.EDGES].size > 0) {
                this.onSelectInside(null, null, null, true);
            }
        };

        //---------------------------------------------------
        // onHoverInside
        // An element was hovered inside this component.
        // Params: item: a data object
        // element: the corresponding DOM element
        // on: boolean
        //---------------------------------------------------
        proto.onHoverInside = function (element, item, on) {
            var myInstance = this;
            d3.select(element).classed("hovered", item.hovered = on);
            myInstance.externalEventHandlers.onHover(item);
        };

        //---------------------------------------------------
        // onHoverOutside
        // An element was hovered outside this component.
        // Params: item: data of the hovered element
        //---------------------------------------------------
        proto.onHoverOutside = function (item) {
            var itemType = (item.class === constants.CLASS_NODE ?
                constants.NODES : constants.EDGES);
            this.elements[itemType].filter(function (d) {
                    return d.id === item.id;
                })
                .classed("hovered", item.hovered);
        };

        //---------------------------------------------------
        // onSelectInside
        // When an element was selected inside this component.
        // Params: item: the data object bound to the selected element
        // element: the DOM element
        // on: boolean
        // clearOldSelection: whether to clear first the current selection
        //---------------------------------------------------
        proto.onSelectInside = function (element, item, on, clearOldSelection) {
            var myInstance = this;
            var itemType;

            if (clearOldSelection) {
                for (itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                    myInstance.elements[itemType].filter(function (d) {
                        return myInstance.selectedItems[itemType].has(d.id);
                    }).classed("selected", function (d) {
                        return d.selected = false;
                    });
                    myInstance.selectedItems[itemType].clear();
                }
            }

            // Update the DOM element
            if (element) {
                d3.select(element).classed("selected", item.selected = on);
            }

            // Update the selectedItems set
            if (item) {
                itemType = (item.class === constants.CLASS_NODE ? constants.NODES : constants.EDGES);
                if (item.selected) {
                    myInstance.selectedItems[itemType].add(item.id);
                } else {
                    myInstance.selectedItems[itemType].delete(item.id);
                }
            }

            // In "selectionMode" the unselected nodes are visually marked
            myInstance.svg.classed("selectionMode",
                myInstance.selectedItems[constants.NODES].size + myInstance.selectedItems[constants.EDGES].size);

            myInstance.externalEventHandlers.onSelect();
        };

        //---------------------------------------------------
        // onSelectOutside
        // Elements were selected and/or unselected outside this component.
        //---------------------------------------------------
        proto.onSelectOutside = function () {
            var myInstance = this, mySet;

            for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                (mySet = this.selectedItems[itemType]).clear();
                this.elements[itemType]
                    .classed('selected', function (d) {
                        if (d.selected) {
                            mySet.add(d.id);
                            return true;
                        } else {
                            return false;
                        }
                    });
            }

            // In "selectionMode" the unselected nodes are visually marked
            myInstance.svg.classed("selectionMode",
                myInstance.selectedItems[constants.NODES].size + myInstance.selectedItems[constants.EDGES].size);
        };

        //---------------------------------------------------
        // onZoom
        // Perform pan/zoom
        //---------------------------------------------------
        proto.onZoom = function () {
            var trans = d3.event.translate,
                scale = d3.event.scale;

            if (this.inSvgWrapper) {
                this.inSvgWrapper.attr("transform",
                    "translate(" + trans + ")"
                    + " scale(" + scale + ")");
            }
        };

        //---------------------------------------------------
        // onDrag
        // Node-dragging event handler
        //---------------------------------------------------
        proto.onDrag = function (d) {
            // Make the dragged node fixed (not moved by the simulation)
            this.elements[constants.NODES].filter(function (nodeData) {
                return nodeData.id === d.id;
            }).classed("fixed", d.fixed = true);

            this.fixedNodesMode = true;
        };

        //---------------------------------------------------
        // onPlayPauseBtnClick
        // Pause fixes all the nodes
        // Play unfixes all the nodes
        //---------------------------------------------------
        proto.onPlayPauseBtnClick = function () {
            if (this.fixedNodesMode) {
                this.elements[constants.NODES].classed('fixed', function (d) {
                    return d.fixed = false;
                });
                this.fixedNodesMode = false;
                this.force.start();
            } else {
                this.elements[constants.NODES].classed('fixed', function (d) {
                    return d.fixed = true;
                });
                this.fixedNodesMode = true;
            }
        };

        //---------------------------------------------------
        // onLabelsShowHideBtnClick
        // Hide or show labels
        // TODO: add animation
        //---------------------------------------------------
        proto.onLabelsShowHideBtnClick = function () {
            var myInstance = this;
            if (this.config.hideLabels = !this.config.hideLabels) {
                this.labelGroup.transition().attr("opacity", "0");
                setTimeout(function () {
                    myInstance.labelGroup.classed('display_none', true);
                    //}, constants.SHORT_ANIMATION_DELAY_MS); // TODO: animation temporarily disabled
                }, constants.LONG_ANIMATION_DELAY_MS);
            } else { // show labels
                this.labelGroup.classed('display_none', false);
                setTimeout(function () {
                    myInstance.labelGroup.transition().attr("opacity", "1");
                }, constants.SHORT_ANIMATION_DELAY_MS);
            }
        };

        //---------------------------------------------------
        // onNodeWeightShowHideBtnClick
        // Show or hide node weights
        //---------------------------------------------------
        proto.onNodeWeightShowHideBtnClick = function () {
            var myInstance = this;
            this.config.showNodeWeight = !this.config.showNodeWeight;
            this.elements[constants.NODES]
                .attr("d", d3.svg.symbol()
                    .type(function (d) {
                        return d.shape;
                    })
                    .size(function (d) {
                        return myInstance.getNodeIconArea(d);
                    }));
        };

        //---------------------------------------------------
        // onEdgeWeightShowHideBtnClick
        // Show or hide edge weights
        //---------------------------------------------------
        proto.onEdgeWeightShowHideBtnClick = function () {
            var myInstance = this;
            this.config.showEdgeWeight = !this.config.showEdgeWeight;
            this.elements[constants.EDGES]
                .attr("stroke-width", (!this.config.showEdgeWeight ? null : function (d) {
                    return myInstance.getEdgeWidth(d);
                }));
        };

        //---------------------------------------------------
        return AutoForceLayoutFactory;
    }])


    //---------------------------------------------------------------//
    .constant('AutoForceLayoutConstants', {
        INNER_SVG_WIDTH: 540,
        INNER_SVG_HEIGHT: 480,
        NODES: 0,
        EDGES: 1,
        NODES_ID: 1,
        EDGES_ID: 2,
        CLASS_NODE: 'Node',
        CLASS_EDGE: 'Edge',
        CSS_CLASS_NODE: 'node',
        CSS_CLASS_EDGE: 'edge',
        DEFAULT_LINE_WIDTH: 1.5,
        MAX_ZOOM: 0.5,
        MIN_ZOOM: 2,
        ZOOM_TRANSITION_DURATION_MS: 1000,
        LONG_ANIMATION_DELAY_MS: 1000,
        SHORT_ANIMATION_DELAY_MS: 200,
        get NODE_SIZE_ADDITION_PER_WEIGHT_UNIT() {
            return this.INNER_SVG_WIDTH * this.INNER_SVG_HEIGHT / (64 * 48 * 5);
        }
    })


    //---------------------------------------------------------------//
    .service('AutoForceLayoutHelper', ['AutoForceLayoutConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
        return {

            //---------------------------------------------------
            // addButtons
            // Add a buttons bar, at the top of thw container
            //---------------------------------------------------
            addButtons: function (scope, container) {
                var template = templates.get('autoForceLayout/buttons');
                var element = angular.element(template);
                var compiledElement = $compile(element)(scope);
                container.prepend(compiledElement);
                // Event handlers
                //scope.onPlayPauseBtnClick =
            },

            //---------------------------------------------------
            // applyScopeToEventHandlers
            // apply Angular's scope.$apply (set $watch) to user's event handlers
            //---------------------------------------------------
            applyScopeToEventHandlers: function (ctrl, scope) {
                return {

                    onHover: function (d, on) {
                        scope.$apply(function () {
                            ctrl.onHover({item: d, on: on});
                        });
                    },

                    onSelect: function (d, on, clearOldSelection) {
                        scope.$apply(function () {
                            ctrl.onSelect({item: d, on: on, clearOldSelection: clearOldSelection});
                        });
                    }

                }; // return {
            },

            //---------------------------------------------------
            // calcRightAngledOffset
            // Calculate where to display edges, for the case of multiple edges between two nodes
            //---------------------------------------------------
            calcRightAngledOffset: function (basicOffset, origDx, origDy) {
                var dx, dy;
                if (basicOffset === 0) {
                    dx = dy = 0;
                } else if (origDy === 0 || Math.abs(origDx / origDy) > 1) {
                    dy = -basicOffset * constants.INNER_SVG_WIDTH / constants.INNER_SVG_HEIGHT;
                    dx = basicOffset * (origDy) / origDx;
                } else {
                    dx = basicOffset;
                    dy = basicOffset * (-origDx) / origDy;
                }
                return {dx: dx, dy: dy};
            },

            //---------------------------------------------------
            // computeFrictionParameter
            // For the force-simulation, a mysterious formula supplied by Omer.
            //---------------------------------------------------
            computeFrictionParameter: function (width_in_pixels, height_in_pixels, number_of_nodes) {
                var A = 0.0356,
                B = -1.162,
                x = 100 * number_of_nodes / (height_in_pixels * width_in_pixels);
                if (x < 0.0634) x = 0.0634;
                var result = A * Math.pow(x, -B);
                console.log(`Calculated friction = ${result} (A=${A} B=${B} x=${x})`);
                return result;
            }

        }; // return {
    }]) // .service


    /*
     //---------------------------------------------------------------//
     .service('AutoForceLayoutNodeState', ['AutoForceLayoutConstants', function (constants) {
     return {
     setNodeHovered: function(node, source) {

     }
     };
     }]) // .service
     */
;
