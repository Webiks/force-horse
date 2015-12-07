//"use strict";
//===============================================================//
// define the autoForceLayout module

angular.module('autoForceLayout', [])

    //---------------------------------------------------------------//
    .run(function ($templateCache) {
        // cache our buttons template
        $templateCache.put('autoForceLayout/buttons',
            '<div class="buttonsWrapper" layout="row" layout-align="start center" layout-padding>\
              <span flex="50">\
                <i class="mdi mdi-filter"></i>\
                <i class="mdi mdi-wrap"></i>\
                <i class="mdi mdi-play-circle-outline"></i>\
              </span>\
              <span flex="50">\
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
                onLinkHovered: '&',
                onNodeHovered: '&'
            },
            bindToController: true,
            controller: function ($scope, $element) {
                //console.log('In autoForceLayout controller');

                this.eventHandlers = services.applyScopeToEventHandlers(this, $scope);
                // Create my instance
                // Also provide the caller with a reference to my instance, for API
                this.options.autoForceLayoutInstance = new AutoForceLayoutFactory()
                    .initLayout($element, this.options, this.eventHandlers)
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
        function AutoForceLayoutFactory() {
        }

        var proto = AutoForceLayoutFactory.prototype;

        //---------------------------------------------------
        // initLayout
        //---------------------------------------------------
        proto.initLayout = function (element, options, eventHandlers) {
            //console.log('in initLayout()');
            var myInstance = this;

            // Save parameters
            this.options = options;
            this.data = options.data;
            this.eventHandlers = eventHandlers;

            // Input initial processing
            this.nodesById = services.compileNodes(this.data.nodes);
            this.linksById = services.compileLinks(this.data.links, this.nodesById);

            // Some nodes-related fields
            this.numOfNodes = this.data.nodes.length;
            this.nodeDefaultSize = constants.INNER_SVG_WIDTH / 64 * constants.INNER_SVG_HEIGHT / 48 * 2;
            this.numOfSelectedNodes = 0;
            this.dragMode = false;
            this.draggedNodeId = null;

            // Create a forceLayout instance
            this.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .charge(-400)
                .linkDistance(40)
                .on("tick", function () {
                    services.onTick(myInstance);
                })
                .on("end", function () {
                    services.onForceEnd(myInstance);
                });

            this.drag = this.force.drag()
                .on("dragstart", services.onDragStart)
                .on("drag", function(d) {
                    services.onDrag(d, myInstance);
                })
                .on("dragend", services.onDragEnd);

            this.force.nodes(this.data.nodes)
                .links(this.data.links)
                .start();

            // create the main SVG canvas
            this.svg = d3.select(element[0])
                .append("div")
                .attr("class", "svgWrapper")
                .append("svg")
                .attr("class", "graph-svg")
                .attr("viewBox", "0 0 " + constants.INNER_SVG_WIDTH + " " + constants.INNER_SVG_HEIGHT)
                .attr("preserveAspectRatio", "none");

            return this;
        }; // end of Layout()

        //---------------------------------------------------
        // redraw the graph
        //---------------------------------------------------
        proto.redraw = function () {
            //console.log('in redraw()');
            var myInstance = this;

            // draw links
            this.links = this.svg.selectAll(".link")
                .data(this.data.links)
                .enter()
                .append("line")
                .attr("class", "link")
                .on("mouseover", function (d) {
                    myInstance.eventHandlers.onLinkHovered(d, true);
                })
                .on("mouseout", function (d) {
                    myInstance.eventHandlers.onLinkHovered(d, false);
                });

            // draw nodes
            this.nodes = this.svg.selectAll(".node")
                .data(this.data.nodes)
                .enter()
                .append("path")
                // Set node shape & size
                .attr("d", d3.svg.symbol()
                    .type(function (d) {
                        return d.shape;
                    })
                    .size(myInstance.nodeDefaultSize))
                .attr("class", "node")
                .attr("style", function (d) {
                    return "fill:" + d.color;
                })
                .on("mouseover", function (d) {
                    myInstance.setNodeHovered(d, true, constants.SOURCE_IN);
                })
                .on("mouseout", function (d) {
                    myInstance.setNodeHovered(d, false, constants.SOURCE_IN);
                })
                .on("click", function (d) {
                    services.onClick(d, this, myInstance);
                })
                .call(this.drag);

            // draw node labels
            this.labels = this.svg.selectAll("text.label")
                .data(this.data.nodes)
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
        // setNodeHovered
        // State handler
        // Params: node: either node id or a node object
        // on: boolean
        // source: either SOURCE_IN or SOURCE_OUT
        //---------------------------------------------------
        proto.setNodeHovered = function (node, on, source) {
            //if (typeof source === "undefined") {
            //    source = constants.SOURCE_OUT;
            //}

            var myInstance = this;

            if (source === constants.SOURCE_IN) {
                myInstance.eventHandlers.onNodeHovered(node, on);
            }
        };

        return AutoForceLayoutFactory;
    }])


    //---------------------------------------------------------------//
    .constant('AutoForceLayoutConstants', {
        INNER_SVG_WIDTH: 640,
        INNER_SVG_HEIGHT: 480,
        SOURCE_IN: 0,
        SOURCE_OUT: 1
    })


    //---------------------------------------------------------------//
    .service('AutoForceLayoutServices', ['AutoForceLayoutConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
        return {

            //---------------------------------------------------
            // onTick
            // Update the graph
            //---------------------------------------------------
            onTick: function (myInstance) {
                // Update links
                myInstance.links.attr("x1", function (d) {
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
                myInstance.nodes.attr('transform', function (d) {
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
            // onClick
            // Event handler. Manage node selection
            //---------------------------------------------------
            onClick: function (d, element, myInstance) {
                //console.log("on Click, prevented =" + d3.event.defaultPrevented);
                // Ignore the click event at the end of a drag
                if (d3.event.defaultPrevented) return;
                d3.select(element).classed("selected", d.selected = !d.selected);
                myInstance.svg.classed("selectionMode", myInstance.numOfSelectedNodes += (d.selected ? 1 : -1));
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
                // Flag drag mode, and make the dragged node fixed (not moved by the simulation).
                // These settings will be removed on force end event (end of current simulation).
                // I flag the dragging on drag event, and not on dragStart event,
                // because dragStart is thrown even if you just click on the node, without really dragging.
                if (!myInstance.dragMode || myInstance.draggedNodeId !== d.id) {
                    // Mark drag mode (it will cancelled in the next force-end event)
                    myInstance.dragMode = true;
                    // Mark the presently dragged node as immovable by the simulation.
                    d.fixed = true;
                    // If we drag a node, before the simulation that started after we dragged another node,
                    // had ended, mark the previously dragged node as movable by the simulation.
                    if (myInstance.draggedNodeId !== d.id && Number.isInteger(myInstance.draggedNodeId)) {
                        myInstance.data.nodes[myInstance.nodesById[myInstance.draggedNodeId]].fixed = false;
                    }
                    myInstance.draggedNodeId = d.id;
                }
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
                //console.log('onForceEnd called');
                // If the ending simulation is one triggered by a node dragging,
                // make the dragged node movable (it gets fixed during the dragging and
                // the ensuing simulation.
                if (myInstance.dragMode) {
                    myInstance.dragMode = false;
                    myInstance.data.nodes[myInstance.nodesById[myInstance.draggedNodeId]].fixed = false;
                }
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
            // compileLinks
            // Add references to the given links array
            //---------------------------------------------------
            compileLinks: function (linksArray, nodesById) {
                var linksById = {};
                linksArray.forEach(function (val, idx) {
                    if (typeof val.id === "undefined") {
                        console.error("Undefined <id> in links array");
                    } else {
                        linksById[val.id] = idx;
                    }
                    if (typeof val.sourceID === "undefined") {
                        console.error("Undefined [sourceID] in links array");
                    } else {
                        val.source = nodesById[val.sourceID];
                    }
                    if (typeof val.targetID === "undefined") {
                        console.error("Undefined [targetID] in links array");
                    } else {
                        val.target = nodesById[val.targetID];
                    }
                });
                return linksById;
            },

            //---------------------------------------------------
            // applyScopeToEventHandlers
            // apply Angular's scope.$apply (set $watch) to user's event handlers
            //---------------------------------------------------
            applyScopeToEventHandlers: function (ctrl, scope) {
                return {

                    onLinkHovered: function (d, on) {
                        scope.$apply(function () {
                            ctrl.onLinkHovered({item: d, on: on});
                        });
                    },

                    onNodeHovered: function (d, on) {
                        scope.$apply(function () {
                            ctrl.onNodeHovered({item: d, on: on});
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
