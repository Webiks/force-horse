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
                onHovered: '&',
                onNodeSelected: '&'
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

            // Input initial processing
            //this.commonData = this.options.data;
            this.nodeDataArray = this.options.data[constants.NODES].data;
            this.edgeDataArray = this.options.data[constants.EDGES].data;
            this.nodesById = services.compileNodes(this.nodeDataArray);
            services.compileEdges(this.edgeDataArray, this.nodesById);

            // Some nodes-related fields
            this.nodeDefaultSize = constants.INNER_SVG_WIDTH / 64 * constants.INNER_SVG_HEIGHT / 48 * 2;
            this.selectedEntities = new Set();
            this.fixedNodesMode = false;

            // Create a forceLayout instance
            this.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .charge(-400)// TODO: constants
                .linkDistance(40)
                .on("tick", function () {
                    services.onTick(myInstance);
                })
                .on("end", function () {
                    services.onForceEnd(myInstance);
                });

            this.drag = this.force.drag()
                .on("dragstart", services.onDragStart)
                .on("drag", function (d) {
                    services.onDrag(d, myInstance);
                })
                .on("dragend", services.onDragEnd);

            this.force.nodes(this.nodeDataArray)
                .links(this.edgeDataArray)
                .start();

            // Create the main SVG canvas.
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
                    services.onContainerClicked(myInstance)
                });

            return this;
        }; // end of Layout()

        //---------------------------------------------------
        // draw
        // Draw the graph: nodes, edges, labels
        //---------------------------------------------------
        proto.draw = function () {
            //console.log('in redraw()');
            var myInstance = this;
            myInstance.myElements = {};

            // draw edges
            this.myElements.edges = this.svg.selectAll("."+constants.CSS_CLASS_EDGE)
                .data(this.edgeDataArray)
                .enter()
                .append("line")
                .attr("class", constants.CSS_CLASS_EDGE)
                .attr("style", function (d) {
                    return "stroke:" + d.color;
                })
                .on("mouseenter", function (d) {
                    myInstance.onHoveredInside(this, d, true);
                })
                .on("mouseleave", function (d) {
                    myInstance.onHoveredInside(this, d, false);
                });

            // draw nodes
            this.myElements.nodes = this.svg.selectAll("."+constants.CSS_CLASS_NODE)
                .data(this.nodeDataArray)
                .enter()
                .append("path")
                // Set node shape & size
                .attr("d", d3.svg.symbol()
                    .type(function (d) {
                        return d.shape;
                    })
                    .size(myInstance.nodeDefaultSize))
                .attr("class", constants.CSS_CLASS_NODE)
                .attr("style", function (d) {
                    return "fill:" + d.color;
                })
                .on("mouseenter", function (d) {
                    myInstance.onHoveredInside(this, d, true);
                })
                .on("mouseleave", function (d) {
                    myInstance.onHoveredInside(this, d, false);
                })
                .on("click", function (d) {
                    services.onNodeClicked(d, this, myInstance);
                })
                .call(this.drag);

            // draw node labels
            this.labels = this.svg.selectAll("text.label")
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
        // onHoveredInside
        // An element was hovered inside this component.
        // Params: item: a data object
        // element: the corresponding DOM element
        // on: boolean
        //---------------------------------------------------
        proto.onHoveredInside = function (element, item, on) {
            var myInstance = this;
            d3.select(element).classed("hovered", item.hovered = on);
            myInstance.externalEventHandlers.onHovered(item);
        };

        //---------------------------------------------------
        // onHoveredOutside
        // An element was hovered outside this component.
        // Params: item: data of the hovered element
        //---------------------------------------------------
        proto.onHoveredOutside = function (item) {
            var myInstance = this;
            var elements = (item.class === constants.CLASS_NODE ?
                myInstance.myElements.nodes : myInstance.myElements.edges);
            elements.filter(function (d) {
                    return d.id === item.id;
                })
                .classed("hovered", item.hovered);
        };

        //---------------------------------------------------
        // inSetNodeSelected
        // When a node (or nodes) was selected inside this component.
        // Params: nodeData: a node object
        // element: the corresponding DOM element
        // on: boolean
        // clearOldSelection: whether to clear first the current selection
        //---------------------------------------------------
        proto.inSetNodeSelected = function (element, nodeData, on, clearOldSelection) {
            var myInstance = this;

            if (clearOldSelection) {
                myInstance.myElements.nodes.filter(function (d) {
                    return myInstance.selectedEntities.has(d.id);
                }).classed("selected", function (d) {
                    return d.selected = false;
                });
                myInstance.selectedEntities.clear();
            }

            // Update the DOM element
            if (element) {
                d3.select(element).classed("selected", nodeData.selected = on);
            }

            // Update the selectedEntities set
            if (nodeData) {
                if (nodeData.selected) {
                    myInstance.selectedEntities.add(nodeData.id);
                } else {
                    myInstance.selectedEntities.delete(nodeData.id);
                }
            }

            // In "selectionMode" the unselected nodes are visually marked
            myInstance.svg.classed("selectionMode", myInstance.selectedEntities.size);

            myInstance.externalEventHandlers.onNodeSelected(nodeData, on, clearOldSelection);
        };

        //---------------------------------------------------
        // apiSetNodeSelected
        // When a node (or nodes) was selected outside this component.
        // Params: nodeData: a node object
        // on: boolean
        // clearOldSelection: whether to clear first the current selection
        //---------------------------------------------------
        proto.apiSetNodeSelected = function (nodeData, on, clearOldSelection) {
            var myInstance = this;

            if (clearOldSelection) {
                myInstance.myElements.nodes.filter(function (d) {
                    return myInstance.selectedEntities.has(d.id);
                }).classed("selected", function (d) {
                    return d.selected = false;
                });
                myInstance.selectedEntities.clear();
            }

            // Get the inner node object that corresponds the node object parameter
            nodeData = myInstance.nodeDataArray[myInstance.nodesById[nodeData.id]];

            // Get the corresponding element, and update it
            myInstance.myElements.nodes.filter(function (d) {
                return d.id === nodeData.id;
            }).classed("selected", nodeData.selected = on);

            // Update the selectedEntities set
            if (nodeData.selected) {
                myInstance.selectedEntities.add(nodeData.id);
            } else {
                myInstance.selectedEntities.delete(nodeData.id);
            }

            // In "selectionMode" the unselected nodes are visually marked
            myInstance.svg.classed("selectionMode", myInstance.selectedEntities.size);
        };

        // TODO Add comments
        proto.onPlayPauseBtnClick = function () {
            if (this.fixedNodesMode) {
                this.myElements.nodes.classed('fixed', function (d) {
                    return d.fixed = false;
                });
                this.fixedNodesMode = false;
                this.force.start();
            } else {
                this.myElements.nodes.classed('fixed', function (d) {
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
        CSS_CLASS_EDGE: 'edge'
    })


    //---------------------------------------------------------------//
    .service('AutoForceLayoutServices', ['AutoForceLayoutConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
        return {

            //---------------------------------------------------
            // onTick
            // Update the graph
            //---------------------------------------------------
            onTick: function (myInstance) {
                // Update edges
                myInstance.myElements.edges.attr("x1", function (d) {
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
                    });

                // Update nodes
                myInstance.myElements.nodes.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

                // Update labels
                myInstance.labels.attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });
            },

            //---------------------------------------------------
            // onNodeClicked
            // Event handler. Manage node selection
            //---------------------------------------------------
            onNodeClicked: function (data, element, myInstance) {
                // Ignore the click event at the end of a drag
                if (d3.event.defaultPrevented) return;
                // If the Ctrl key was pressed during the click ..
                // If the clicked element was marked as selected, unselect it, and vice versa
                if (d3.event.ctrlKey) {
                    myInstance.inSetNodeSelected(element, data, !data.selected);
                } else {
                    // If the Ctrl key was not pressed ..
                    // If the clicked node is selected, unselect the other nodes
                    // Else, clear the current selection, and select the clicked node
                    //if (!data.selected) {
                    myInstance.inSetNodeSelected(element, data, true, true);
                    //}
                }
                // Prevent bubbling, so that we can separately detect a click on the container
                d3.event.stopPropagation();
            },

            //---------------------------------------------------
            // onContainerClicked
            // Event handler. on a click not on a node or edge
            // Cancel current selection
            //---------------------------------------------------
            onContainerClicked: function (myInstance) {
                if (myInstance.selectedEntities.size > 0) {
                    myInstance.inSetNodeSelected(null, null, null, true);
                }
            },

            //---------------------------------------------------
            // onDragStart
            // Event handler
            //---------------------------------------------------
            onDragStart: function (d) {
            },

            //---------------------------------------------------
            // onDrag
            // Event handler
            //---------------------------------------------------
            onDrag: function (d, myInstance) {
                // Make the dragged node fixed (not moved by the simulation)
                myInstance.myElements.nodes.filter(function (nodeData) {
                    return nodeData.id === d.id;
                }).classed("fixed", d.fixed = true);

                myInstance.fixedNodesMode = true;
            },

            //---------------------------------------------------
            // onDragEnd
            // Event handler
            //---------------------------------------------------
            onDragEnd: function (d) {
            },

            //---------------------------------------------------
            // onForceEnd
            // Event handler
            //---------------------------------------------------
            onForceEnd: function (myInstance) {
            },

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
            // compileNodes
            // Add references to the given nodes array
            //---------------------------------------------------
            compileNodes: function (nodesArray) {
                var nodesById = {};
                nodesArray.forEach(function (val, idx) {
                    if (typeof val.id === "undefined") {
                        console.error("Undefined [id] in nodes array");
                    } else {
                        nodesById[val.id] = idx;
                    }
                });
                return nodesById;
            },

            //---------------------------------------------------
            // compileEdges
            // Add references to the given edges array
            //---------------------------------------------------
            compileEdges: function (edgesArray, nodesById) {
                var edgesById = {};
                edgesArray.forEach(function (val, idx) {
                    if (typeof val.id === "undefined") {
                        console.error("Undefined <id> in edges array");
                    } else {
                        edgesById[val.id] = idx;
                    }
                    if (typeof val.sourceID === "undefined") {
                        console.error("Undefined [sourceID] in edges array");
                    } else {
                        val.source = nodesById[val.sourceID];
                    }
                    if (typeof val.targetID === "undefined") {
                        console.error("Undefined [targetID] in edges array");
                    } else {
                        val.target = nodesById[val.targetID];
                    }
                });
                return edgesById;
            },

            //---------------------------------------------------
            // applyScopeToEventHandlers
            // apply Angular's scope.$apply (set $watch) to user's event handlers
            //---------------------------------------------------
            applyScopeToEventHandlers: function (ctrl, scope) {
                return {

                    onHovered: function (d, on) {
                        scope.$apply(function () {
                            ctrl.onHovered({item: d, on: on});
                        });
                    },

                    onNodeSelected: function (d, on, clearOldSelection) {
                        scope.$apply(function () {
                            ctrl.onNodeSelected({item: d, on: on, clearOldSelection: clearOldSelection});
                        });
                    }

                }; // return {
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
