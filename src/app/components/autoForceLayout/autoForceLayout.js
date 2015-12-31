//"use strict";
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
                <i class="mdi mdi-filter"></i>\
                <i class="mdi mdi-wrap"></i>\
                <i class="play-pause-btn mdi"\
                   ng-class="autoForceLayoutInstance.fixedNodesMode ? \'mdi-play-circle-outline\' : \'mdi-pause-circle-outline\'" \
                   ng-click="autoForceLayoutInstance.onPlayPauseBtnClick()"></i>\
              </span>\
              <span flex>\
                <i class="mdi mdi-label"></i>\
                <i class="mdi mdi-minus"></i>\
                <i class="mdi mdi-regex"></i>\
              </span>\
            </div>');
    })

    //---------------------------------------------------------------//
    .directive('autoForceLayout', ['$compile', 'AutoForceLayoutFactory', 'AutoForceLayoutServices', function ($compile, AutoForceLayoutFactory, services) {
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

                this.externalEventHandlers = services.applyScopeToEventHandlers(this, $scope);
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
                services.addButtons(scope, element);
            }
        };
    }])

    //---------------------------------------------------------------//
    .factory('AutoForceLayoutFactory', ['AutoForceLayoutConstants', 'AutoForceLayoutServices', function (constants, services) {
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
            this.initLayout();
            this.draw();
            return this;
        };

        //---------------------------------------------------
        // initLayout
        // Init force layout & SVG
        //---------------------------------------------------
        proto.initLayout = function () {
            var myInstance = this;

            // Process input data
            this.nodeDataArray = this.options.data[constants.NODES].data;
            this.edgeDataArray = this.options.data[constants.EDGES].data;
            this.processNodes();
            this.processEdges();

            // Some nodes-related fields
            // The size (area) of the containing circle
            this.nodeIconArea = constants.INNER_SVG_WIDTH / 64 * constants.INNER_SVG_HEIGHT / 48 * 2;
            this.nodeIconRadius = Math.sqrt(this.nodeIconArea / Math.PI);
            this.selectedItems = [new Set(), new Set()]; // selected nodes, selected edges
            this.fixedNodesMode = false;
            this.isBoundedGraphMode = false; // TODO: delete?
            this.isFirstZoomDone = false; // See onForceEnd()

            // Create a forceLayout instance
            this.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .charge(-400)// TODO: constants
                .linkDistance(40)
                .on("tick", function () {
                    myInstance.onTick();
                })
                .on("end", function () {
                    myInstance.onForceEnd();
                });

            this.drag = this.force.drag()
                .on("drag", function (d) {
                    myInstance.onDrag(d);
                });

            this.force.nodes(this.nodeDataArray)
                .links(this.edgeDataArray)
                .start();

            // Create the main SVG (canvas).
            // If that element exists, remove it first.
            // TODO - is the element really removed from memory (and not just the DOM)?
            d3.select(this.element)
                .select("div.svgWrapper")
                .remove();
            this.svg = d3.select(this.element)
                .append("div")
                .attr("class", "svgWrapper")
                .append("svg")
                .attr("class", "graph-svg")
                .attr("viewBox", "0 0 " + constants.INNER_SVG_WIDTH + " " + constants.INNER_SVG_HEIGHT)
                .attr("preserveAspectRatio", "none")
                .on("click", function () {
                    myInstance.onContainerClick()
                })
                .call(d3.behavior.zoom()
                    .scaleExtent([constants.MIN_ZOOM, constants.MAX_ZOOM])
                    .on("zoom", function () {
                        myInstance.onZoom();
                    }))
            ;

            // Set wrapper group, to use for pan & zoom
            this.inSvgWrapper = this.svg.append("g");

            // Set SVG groups, and through them default colors,
            // for nodes and edges (note: the edge group has to be inserted first, so that the nodes
            // will render above the edges).
            this.edgeGroup = this.inSvgWrapper.append("g")
                .attr("class", "edges") // TODO: constants
                .attr("stroke", "lightgray")
                .attr("stroke-width", constants.DEFAULT_LINE_WIDTH + 'px');
            this.nodeGroup = this.inSvgWrapper.append("g")
                .attr("class", "nodes") // TODO: constants
                .attr("fill", "lightgray");

            return this;
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
                    .size(myInstance.nodeIconArea))
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
            this.labels = this.inSvgWrapper.selectAll("text.label")
                .data(this.nodeDataArray)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("dx", "15") // TODO
                .text(function (d) {
                    return d.label;
                });

            return this;
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
                    console.error("Undefined [id] in edge " + val.sourceID + "-" + val.targetID);
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
                    var offset = services.calcRightAngledOffset(d.basicOffset, d.target.x - d.source.x, d.target.y - d.source.y);
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
            // This is done only on the first time after componenet start.
            var width = constants.INNER_SVG_WIDTH,
                height = constants.INNER_SVG_HEIGHT;
            if (!this.isFirstZoomDone) {
                var maxMarginX = d3.max(this.nodeDataArray, function (d) {
                        return Math.max(-d.x, d.x - width, 0); // TODO: add node radius
                    }),
                    maxMarginY = d3.max(this.nodeDataArray, function (d) {
                        return Math.max(-d.y, d.y - height, 0); // TODO: add node radius
                    });
                if (maxMarginX > 0 || maxMarginY > 0) {
                    var scale = Math.min(width / (width + 2 * maxMarginX),
                            height / (height + 2 * maxMarginY)),
                        translate = [(width / 2) * (1 - scale), (height / 2) * (1 - scale)];
                    this.inSvgWrapper.transition()
                        .duration(750)// TODO: constant
                        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
                }
                this.isFirstZoomDone = true;
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

            this.inSvgWrapper.attr("transform",
                "translate(" + trans + ")"
                + " scale(" + scale + ")");
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
                this.elements.nodes.classed('fixed', function (d) {
                    return d.fixed = true;
                });
                this.fixedNodesMode = true;
            }
        };

        //---------------------------------------------------
        return AutoForceLayoutFactory;
    }])


    //---------------------------------------------------------------//
    .constant('AutoForceLayoutConstants', {
        INNER_SVG_WIDTH: 640,
        INNER_SVG_HEIGHT: 480,
        SOURCE_IN: 0,
        SOURCE_OUT: 1,
        NODES: 0,
        EDGES: 1,
        NODES_ID: 1,
        EDGES_ID: 2,
        CLASS_NODE: 'Node',
        CLASS_EDGE: 'Edge',
        CSS_CLASS_NODE: 'node',
        CSS_CLASS_EDGE: 'edge',
        MIN_ZOOM: 0.5,
        MAX_ZOOM: 2,
        DEFAULT_LINE_WIDTH: 1.5
    })


    //---------------------------------------------------------------//
    .service('AutoForceLayoutServices', ['AutoForceLayoutConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
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
