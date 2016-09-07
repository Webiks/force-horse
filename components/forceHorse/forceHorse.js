"use strict";
/**
 * @ngdoc overview
 * @name forceHorse
 * @description A graph visualizer using a "force layout" engine (d3.js)
 */
angular.module('forceHorse', [])

    //---------------------------------------------------------------//
    .run(function ($templateCache) {
        // cache our buttons template
        $templateCache.put('forceHorse/buttons',
            '<div class="buttonsWrapper">\
               <span>\
                <i class="img img-filter"\
                   title="Remove selected elements"\
                   ng-if="forceHorseInstance.config.showFilterButton" \
                   ng-click="forceHorseInstance.onFilterInside()"></i>\
                <i class="img"\
                   title="Fix/release all nodes"\
                   ng-class="forceHorseInstance.fixedNodesMode ? \'img-play-circle-outline\' : \'img-pause-circle-outline\'" \
                   ng-click="forceHorseInstance.toggleFixedNodesMode()"></i>\
                <i class="img img-home"\
                   title="Zoom to viewport"\
                   ng-click="forceHorseInstance.zoomToViewport()"></i>\
                   </span>\
               <span>\
                <i class="img"\
                   title="Show/hide labels"\
                   ng-if="forceHorseInstance.config.showLabelsButton" \
                   ng-class="forceHorseInstance.config.showLabels ? \'img-label-outline\' : \'img-label\'" \
                   ng-click="forceHorseInstance.onLabelsShowHideBtnClick()"></i>\
                <i class="img img-link-weight"\
                   title="Show/hide edge weight"\
                   ng-if="forceHorseInstance.config.showEdgeWeightButton" \
                   ng-click="forceHorseInstance.onEdgeWeightShowHideBtnClick()"></i>\
                <i class="img img-node-weight"\
                   title="Show/hide node weight"\
                   ng-if="forceHorseInstance.config.showNodeWeightButton" \
                   ng-click="forceHorseInstance.onNodeWeightShowHideBtnClick()"></i>\
               </span>\
            </div>');
    })

    /**
     * @ngdoc directive
     * @name forceHorse.directive:forceHorse
     * @restrict EA
     * @scope
     * @priority 100
     * @description Directive definition for the forceHorse component
     */
    .directive('forceHorse', ['$compile', 'ForceHorseFactory', 'ForceHorseHelper', function ($compile, ForceHorseFactory, helper) {
        return {
            restrict: "EA",
            controllerAs: "forceHorseCtrl",
            priority: 100,
            scope: {
                options: "="
            },
            bindToController: true,

            controller: function ($scope, $element) {
                var vm = this;
                // Create my instance
                // Also provide the caller with a reference to my instance, for API
                this.requestDigest = function () {
                    try {
                        $scope.$digest();
                    } catch (e){}
                };

                this.options.forceHorseInstance =
                    $scope.forceHorseInstance = new ForceHorseFactory($element, this.options, this.requestDigest)
                        .redraw();

                // Clear the instance reference on destruction, to prevent memory leak
                $scope.$on("$destroy", function () {
                    console.log("Destroying forceHorse instance");
                    vm.options.forceHorseInstance =
                        $scope.forceHorseInstance = null;
                });
            },

            link: function (scope, element) { //, attr, ctrl) {
                //console.log('In forceHorse link');

                // Add CSS class to set a CSS "namespace"
                element.addClass("force-horse");
                // Add flex-box properties (moved to css)
                // element.attr("layout", "column");
                // element.attr("flex", "");
                // Add button bar
                helper.addButtons(scope, element);
            }
        };
    }])

    /**
     * @ngdoc factory
     * @name forceHorse.factory:ForceHorseFactory
     * @description Produces a class-instance for each instance of ForceHorse on a page
     */
    .factory('ForceHorseFactory', ['$http', '$log', 'ForceHorseConstants', 'ForceHorseHelper',
        function ($http, $log, constants, helper) {
        /**
         * @ngdoc method
         * @name ForceHorseFactory
         * @methodOf forceHorse.factory:ForceHorseFactory
         * @constructor
         * @description Constructor; initializes the eventListeners object
         * @param element A JSLite reference to the HTML container for this component
         * @param options An external options object
         * @param requestDigest callback function: request an angular digest on the element's scope
         */
        function ForceHorseFactory(element, options, requestDigest) {
            this.element = element[0];
            this.options = options;
            this.requestDigest = requestDigest;
            // Set a variable to hold references to registered event listeners
            this.eventListeners = {};
        }

        var proto = ForceHorseFactory.prototype;

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#redraw
         * @description Draws a new graph, based on the input data
         * @returns {ForceHorseFactory} current instance
         */
        proto.redraw = function () {
            var myInstance = this;
            var proceed = function (json) {
                myInstance.initLayout(json);
                // The force simulation has to started before drawing nodes and links,
                // because it computes some drawing-relevant properties (node weight)
                myInstance.startForceSimulation();
                myInstance.draw();
            };
            // $http.get(helper.getCurrentDirectory() + constants.CONFIG_FILE_NAME)
            // Get init (forceHorse.json) file from app root dir
            $http.get(constants.CONFIG_FILE_NAME)
            .then(function (response) {
                proceed(response.data);
            }, function (response) {
                $log.warn(constants.CONFIG_FILE_NAME + ' ' + response.statusText);
                proceed({});
            });
            //d3.json("forceHorse.json", function (error, json) {
            //    if (error) {
            //        console.warn(error);
            //        json = {};
            //    }
            //    myInstance.initLayout(json);
            //    myInstance.draw();
            //    myInstance.startForceSimulation();
            //});
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#initLayout
         * @description Init force layout & SVG
         * @param config an external configration object (typically from a json file)
         * @returns {ForceHorseFactory} current instance
         */
        proto.initLayout = function (config) {
            var myInstance = this;
            // Generate a random instance name, for a "namespace"
            this.instanceName = new Array(constants.INSTANCE_NAME_LENGTH).fill(null).map(function () {
                return constants.ALEPHBET.charAt(Math.floor(Math.random() * constants.ALEPHBET.length));
            }).join('');

            // Process input data
            var data = this.options.data;
            if (!(data instanceof Array)) {
                data = helper.convertFileDataFormat(data);
            }
            this.nodeDataArray = data[constants.NODES].data;
            this.edgeDataArray = data[constants.EDGES].data;
            this.processNodes();
            this.processEdges();

            // Some nodes-related fields
            // The size (area) of the containing circle
            this.numOfNodes = this.nodeDataArray.length;
            this.nodeIconAreaDefault = constants.INNER_SVG_WIDTH / 54 * constants.INNER_SVG_HEIGHT / 48 * 2;
            this.nodeIconRadius = Math.sqrt(this.nodeIconAreaDefault / Math.PI);
            this.selectedItems = [new Set(), new Set()]; // selected nodes, selected edges
            this.fixedNodesMode = false;
            //this.isBoundedGraphMode = false; // redundant?
            this.isFirstZoomDone = false; // Zooming to viewport after first simlation
            this.isDragging = false;

            // Set config parameters, which may be overwritten by the config argument
            // (that is, in fact, by an external json file)
            this.config = {
                showLabels: false,
                showNodeWeight: false,
                showEdgeWeight: false,
                showFilterButton: true,
                showLabelsButton: true,
                showNodeWeightButton: true,
                showEdgeWeightButton: true,
                useEdgesWeights: false,
                forceParameters: {
                    //charge: -350,
                    linkStrength: 1,
                    gravity: 0.3,
                    linkDistance: 10
                }
            };
            Object.assign(this.config, config);

            // Create a forceLayout instance
            myInstance.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .on("start", function () {
                    myInstance.onForceStart();
                });
            var p;
            if (angular.isDefined(p = myInstance.config.forceParameters.linkDistance)) myInstance.force.linkDistance(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.linkStrength)) myInstance.force.linkStrength(p);
            //if (angular.isDefined(p = myInstance.config.forceParameters.charge)) myInstance.force.charge(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.gravity)) myInstance.force.gravity(p);
            if (angular.isDefined(p = myInstance.config.forceParameters.charge)) {
                myInstance.force.charge(p);
            } else {
                if (myInstance.numOfNodes < constants.HEAVY_SIMULATION_NUM_OF_NODES) {
                    myInstance.force.charge(function (d) {
                        return d.weight * constants.DEFAULT_CHARGE_LIGHT;
                    });
                } else {
                    myInstance.force.charge(constants.DEFAULT_CHARGE_HEAVY);
                }
            }
            if (angular.isDefined(p = myInstance.config.forceParameters.friction)) {
                myInstance.force.friction(p);
            } else {
                myInstance.force.friction(helper.computeFrictionParameter(constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT, this.nodeDataArray.length))
            }

            myInstance.drag = myInstance.force.drag()
                .on("drag", function (d) {
                    myInstance.onDrag(d);
                })
                .on("dragend", function () {
                    myInstance.onDragEnd();
                });

            myInstance.force.nodes(myInstance.nodeDataArray)
                .links(this.edgeDataArray);
            //.start();

            myInstance.zoom = d3.behavior.zoom()
                .scaleExtent([constants.MAX_ZOOM, constants.MIN_ZOOM])
                .on("zoom", function () {
                    myInstance.onZoom();
                });

            // Create the main SVG (canvas).
            // If that element exists, remove it first.
            // TODO - is the element really filtered from memory (and not just the DOM)?
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
                .attr("stroke", constants.DEFAULT_EDGE_COLOR)
                .attr("stroke-width", constants.DEFAULT_EDGE_WIDTH + 'px');
            myInstance.nodeGroup = myInstance.inSvgWrapper.append("g")
                .attr("class", "nodes")
                .attr("fill", constants.DEFAULT_NODE_COLOR);
            myInstance.labelGroup = myInstance.inSvgWrapper.append("g")
                .attr("class", "labels")
                .attr("fill", constants.DEFAULT_NODE_COLOR)
                .classed("display_none", !myInstance.config.showLabels);

            return myInstance;
        }; // initLayout()

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#draw
         * @description Set the graph in the DOM: nodes, edges, labels, progress bar
         * @returns {ForceHorseFactory} current instance
         */
        proto.draw = function () {
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
                .attr("fill", function (d) {
                    return d.color;
                })
                .attr("class", constants.CSS_CLASS_NODE)
                .on("mouseenter", function (d) {
                    myInstance.onHoverInside(this, d, true);
                })
                .on("mouseleave", function (d) {
                    myInstance.onHoverInside(this, d, false);
                })
                .on("click", function (d) {
                    myInstance.onClick(d, this);
                })
                .on("dblclick", function (d) {
                    myInstance.callEventListeners("dblclick", d);
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
                .text(function (d) {
                    return d.label;
                })
                .attr("dx", function (d) {
                    return (helper.isHebrewString(d.label) ? -1 : +1) * constants.LABEL_DISPLACEMENT;
                })
                .attr("text-anchor", function (d) {
                    return (helper.isHebrewString(d.label) ? "end" : "start");
                })
            ;

            // Draw progress bar
            this.progressBar = this.svg
                .append('line')
                .attr('class', 'progress')
                .attr('x1', '0')
                .attr('y1', '1')
                .attr('x2', '0')
                .attr('y2', '1');

            // set an on-resize event, to fix aspect ratios
            d3.select(window).on(`resize.${this.instanceName}`, function () {
                myInstance.onWindowResize();
            });

            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#startForceSimulation
         * @description Restart the force simulation
         * @returns {ForceHorseFactory} current instance
         */
        proto.startForceSimulation = function () {
            this.force.start();
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#calcFixAspectRatio
         * @description Returns a number to be multiplied by an element's width, to fix aspect ratio deformation, due to the svg fixAspectRatio="none"
         * @returns {ForceHorseFactory} current instance
         */
        proto.calcFixAspectRatio = function () {
            var currentRect = this.svg[0][0].getBoundingClientRect(),
                currentHeight = currentRect.height,
                currentWidth = currentRect.width;
            this.fixAspectRatio = (constants.INNER_SVG_WIDTH / constants.INNER_SVG_HEIGHT) * (currentHeight / currentWidth);
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#getNodeIconArea
         * @description Calculates the desired node icon area (with or without showing weight)
         * @returns {number}
         */
        proto.getNodeIconArea = function (nodeData) {
            var myInstance = this;
            return myInstance.nodeIconAreaDefault +
                (myInstance.config.showNodeWeight
                    ? (myInstance.config.useEdgesWeights
                        ? nodeData.edgesWeight
                        : angular.isDefined(nodeData.weight)
                            ? nodeData.weight
                            : 1)
                        * constants.node_size_addition_per_weight_unit
                    : 0);
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#getEdgeWidth
         * @description Calculates the desired edge width (with or without showing weight)
         * @returns {number}
         */
        proto.getEdgeWidth = function (edgeData) {
            return constants.DEFAULT_EDGE_WIDTH + (edgeData.weight / 3) + 'px';
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onFilterInside
         * @description Filter button action: remove selected elements
         * @returns {ForceHorseFactory} current instance
         */
        proto.onFilterInside = function () {
            // Mark the selected items as filtered, and unselect them
            // Also clear the selected-items sets
            for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                this.elements[itemType].filter(function (item) {
                    return item.selected;
                }).classed('filtered', function (d) {
                    return d.filtered = true;
                }).classed('selected', function (d) {
                    return d.selected = false;
                });
                this.selectedItems[itemType].clear();
            }

            // Remove the labels of filtered nodes
            this.labels.classed("selected", "false")
                .classed("filtered", function (d) {
                    return d.filtered;
                });

            // Remove edges connected to filtered nodes
            this.elements[constants.EDGES].filter(function (d) {
                return d.source.filtered || d.target.filtered;
            }).classed("filtered", function (d) {
                return d.filtered = true;
            });

            // Cancel selection mode
            this.svg.classed("selectionMode", false);

            // Broadcast event
            this.callEventListeners('filter');

            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onFilterOutside
         * @description API: some elements were filtered out, update the graph
         * @returns {ForceHorseFactory} current instance
         */
        proto.onFilterOutside = function () {
            var myInstance = this;
            // Give the filtered elements the approprite CSS class
            // If a filtered element was selected, mark it as unselected
            for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                this.elements[itemType].filter(function (item) {
                    return item.filtered;
                }).classed('filtered', true)
                    .classed('selected', false)
                    .each(function (d) {
                        let type = (d.class === constants.CLASS_NODE ? constants.NODES : constants.EDGES);
                        myInstance.selectedItems[type].delete(d.id);
                    });
            }

            // Remove the labels of filtered nodes
            this.labels.filter(function (item) {
                return item.filtered;
            }).classed('filtered', true)
                .classed('selected', false);

            // Remove edges connected to filtered nodes
            this.elements[constants.EDGES].filter(function (d) {
                return d.source.filtered || d.target.filtered;
            }).classed("filtered", function (d) {
                return d.filtered = true;
            });

            // Update visual selection mode
            myInstance.svg.classed("selectionMode",
                myInstance.selectedItems[constants.NODES].size + myInstance.selectedItems[constants.EDGES].size);

            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#processNodes
         * @description Graph initialization: add auxiliary properties and variables to the nodes array
         * @returns {ForceHorseFactory} current instance
         */
        proto.processNodes = function () {
            var myInstance = this;
            this.nodesById = {};
            this.nodeDataArray.forEach(function (val, idx) {
                if (angular.isUndefined(val.id)) {
                    val.id = idx;
                    //console.error("Undefined [id] in nodes array");
                }
                myInstance.nodesById[val.id] = idx;
                if (angular.isUndefined(val.label)) {
                    val.label = "" + val.id;
                }
            });
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#processEdges
         * @description Graph initialization: add auxiliary properties and variables to the edges array
         * @returns {ForceHorseFactory} current instance
         */
        proto.processEdges = function () {
            //----------
            function calculateEdgesWeightsForNodes(edge){
                // calculate edges weight
                var sourceNode = myInstance.nodeDataArray[edge.source],
                    targetNode = myInstance.nodeDataArray[edge.target];

                // protect in case undefined
                if (!sourceNode.edgesWeights){
                    sourceNode.edgesWeights = 0;
                }

                if (!targetNode.edgesWeights){
                    targetNode.edgesWeights = 0;
                }

                if (!edge.weight) {
                    edge.weight = 1;
                }

                sourceNode.edgesWeights += edge.weight;
                targetNode.edgesWeights += edge.weight;
            }
            //----------

            var myInstance = this, sid, tid, key;
            this.edgesFromNodes = {};
            this.edgeDataArray.forEach(function (val, idx) {

                if (angular.isUndefined(val.id)) {
                    val.id = idx;
                    // console.warn(`Undefined [id] in edge ${val.sourceID} - ${val.targetID}`);
                }
                // Get nodes data from nodes id's
                if (angular.isUndefined(val.sourceID)) {
                    val.sourceID = val.source;
                    //console.error("Undefined [sourceID] in edge #" + val.id);
                }
                val.source = myInstance.nodesById[val.sourceID];
                if (angular.isUndefined(val.targetID)) {
                    val.targetID = val.target;
                    //console.error("Undefined [targetID] in edges #" + val.id);
                }
                val.target = myInstance.nodesById[val.targetID];

                calculateEdgesWeightsForNodes(val);

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
                    val.basicOffset = (val.multiIdx % 2 === 0 ? val.multiIdx * constants.DEFAULT_EDGE_WIDTH : (-val.multiIdx + 1) * constants.DEFAULT_EDGE_WIDTH);
                }
            });
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onWindowResize
         * @description Fix aspect ratios, when the window resizes
         * @returns {ForceHorseFactory} current instance
         */
        proto.onWindowResize = function () {
            return this.calcFixAspectRatio()
                .updateGraphInDOM();
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onForceStart
         * @description Called when a force-simulation is supposed to start.
         * @returns {ForceHorseFactory} current instance
         */
        proto.onForceStart = function () {
            // Prevent simulation when dragging a node
            if (this.isDragging) {
                this.force.stop();
                return this;
            }
            // Proceed with simulation
            return this.calcFixAspectRatio()
                [this.numOfNodes < constants.HEAVY_SIMULATION_NUM_OF_NODES ?
                "runSimulation" : "runHeavySimulation"]();

        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#runSimulation
         * @description
         * Run the force-simulation with control.
         * The DOM is not updated for every tick.
         * @returns {ForceHorseFactory} current instance
         */
        proto.runSimulation = function () {
            var myInstance = this;
            var ticksPerRender,
                simulationStart = performance.now(), simulationDuration, calculationStart, calculationDuration = 0,
                ticks = 0;

            requestAnimationFrame(function render() {
                // Do not accelerate the simulation during dragging, so as not to slow the dragging.
                ticksPerRender = (myInstance.isDragging ? 1 : myInstance.numOfNodes / 7);
                calculationStart = performance.now();
                for (let i = 0; i < ticksPerRender && myInstance.force.alpha() > 0; i++) {
                    myInstance.force.tick();
                    ticks++;
                }
                calculationDuration += (performance.now() - calculationStart);
                myInstance.updateGraphInDOM().updateProgressBar();

                if (myInstance.force.alpha() > 0) {
                    requestAnimationFrame(render);
                } else {
                    simulationDuration = performance.now() - simulationStart;
                    console.log(`Force Simulation time = ${(simulationDuration / 1000).toFixed(2)}s, Calculation time =  ${(calculationDuration / 1000).toFixed(2)}s, ${ticks} ticks`);
                    myInstance.onForceEnd();
                }
            }); // render
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#runHeavySimulation
         * @description
         * Heavy graphs version: run the force-simulation with control.
         * The DOM is not updated for every tick.
         * @returns {ForceHorseFactory} current instance
         */
        proto.runHeavySimulation = function () {
            var myInstance = this;
            var ticksPerRender,
                calculationStart, calculationDuration = 0,
                ticks = 0;

            requestAnimationFrame(function render() {
                // Do not accelerate the simulation during dragging, so as not to slow the dragging.
                ticksPerRender = (myInstance.isDragging ? 1 : 30);
                calculationStart = performance.now();
                for (let i = 0; i < ticksPerRender && myInstance.force.alpha() > 0; i++) {
                    myInstance.force.tick();
                    ticks++;
                }
                calculationDuration += (performance.now() - calculationStart);
                myInstance.updateProgressBar();
                if (myInstance.isDragging) {
                    myInstance.updateGraphInDOM();
                }

                if (myInstance.force.alpha() > 0) {
                    requestAnimationFrame(render);
                } else {
                    console.log(`Calculation time =  ${(calculationDuration / 1000).toFixed(2)}s, ${ticks} ticks`);
                    myInstance.updateGraphInDOM().onForceEnd();
                }
            }); // render
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#updateGraphInDOM
         * @description
         * Update the force simulation in the DOM
         * @returns {ForceHorseFactory} current instance
         */
        proto.updateGraphInDOM = function () {
            var myInstance = this;

            // Update nodes
            this.elements[constants.NODES]
            //.each(function (d) {
            //    myInstance.preventNodesOverlap(1.0)(d);
            //})
                .attr('transform', function (d) {
                    //if (myInstance.isBoundedGraphMode) {
                    //    // Force the nodes inside the visible area
                    //    var radius = myInstance.nodeIconRadius;
                    //    d.x = Math.max(radius, Math.min(constants.INNER_SVG_WIDTH - radius, d.x));
                    //    d.y = Math.max(radius, Math.min(constants.INNER_SVG_HEIGHT - radius, d.y));
                    //}
                    return `translate(${d.x},${d.y}) scale(${myInstance.fixAspectRatio},1)`;
                })
            ;

            // Update labels
            this.labels.attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
            ;

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

            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#updateProgressBar
         * @returns {ForceHorseFactory} current instance
         */
        proto.updateProgressBar = function () {
            // Do not update progress bar in fixed nodes mode
            if (!this.fixedNodesMode) {
                this.progressBar.attr('x2',
                    constants.INNER_SVG_WIDTH * (1 - this.force.alpha() / constants.MAX_ALPHA));
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onForceEnd
         * @description
         * Called whenever the d3 force-simulation comes to a halt.
         * @returns {ForceHorseFactory} current instance
         */
        proto.onForceEnd = function () {
            // Zoom out the graph, if needed, so that it is fully visible.
            // This is done only on the first time after component start.
            if (!this.isFirstZoomDone) {
                this.zoomToViewport();
                this.isFirstZoomDone = true;
                // Also make the graph fixed, after the first force-simulation
                this.toggleFixedNodesMode();
                this.requestDigest(); // To update the related button's display
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#zoomToViewport
         * @description
         * Zoom out the graph, if needed, so that it is fully visible.
         * @returns {ForceHorseFactory} current instance
         */
        proto.zoomToViewport = function () {
            var scale, translate,
                width = constants.INNER_SVG_WIDTH,
                height = constants.INNER_SVG_HEIGHT,
                radius = this.nodeIconRadius,
                maxMarginX = d3.max(this.nodeDataArray, function (d) {
                    return Math.max(-d.x + radius, d.x + radius - width, 0);
                }),
                maxMarginY = d3.max(this.nodeDataArray, function (d) {
                    return Math.max(-d.y + radius, d.y + radius - height, 0);
                });
            if (maxMarginX > 0 || maxMarginY > 0) {
                // If the graph (without the current zoom/pan) exceeds the view boundaries,
                // calculate the zoom/pan extent to return it to the viewport.
                var scaleX = width / (width + 2 * maxMarginX),
                    scaleY = height / (height + 2 * maxMarginY);
                scale = Math.min(scaleX, scaleY) * 0.95;
                translate = [(width / 2) * (1 - scale), (height / 2) * (1 - scale)];
                // If the calculated zoom is bigger than the zoom limit, increase the limit
                if (scale < constants.MAX_ZOOM) {
                    this.zoom.scaleExtent([scale, constants.MIN_ZOOM]);
                }
            } else {
                // If the graph, without the current zoom/pan, is within the view boundaries,
                // then simply reset the zoom/pan extent.
                scale = 1;
                translate = [0, 0];
            }
            this.svg.transition()
                .duration(constants.ANIMATION_DURATION)
                .call(this.zoom.translate(translate).scale(scale).event);
            return this;
        };

        //---------------------------------------------------
        // preventNodesOverlap
        // A collision-detection algorithm, Based on
        // http://www.coppelia.io/2014/07/an-a-to-z-of-extra-features-for-the-d3-force-layout/
        // and http://bl.ocks.org/mbostock/7881887
        //---------------------------------------------------
        //proto.preventNodesOverlap = function (alpha) {
        //    var radius = this.nodeIconRadius,
        //        padding = constants.NODE_MARGIN,
        //        quadtree = d3.geom.quadtree(this.nodeDataArray);
        //    return function (d) {
        //        var rb = 2 * radius + padding,
        //            nx1 = d.x - rb,
        //            nx2 = d.x + rb,
        //            ny1 = d.y - rb,
        //            ny2 = d.y + rb;
        //        quadtree.visit(function (quad, x1, y1, x2, y2) {
        //            if (quad.point && (quad.point !== d)) {
        //                var x = d.x - quad.point.x,
        //                    y = d.y - quad.point.y,
        //                    l = Math.sqrt(x * x + y * y);
        //                if (l < rb) {
        //                    l = (l - rb) / l * alpha;
        //                    d.x -= x *= l;
        //                    d.y -= y *= l;
        //                    quad.point.x += x;
        //                    quad.point.y += y;
        //                }
        //            }
        //            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        //        });
        //    };
        //};

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onClick
         * @description
         * Event handler. called when an element is clicked on
         * @returns {ForceHorseFactory} current instance
         */
        proto.onClick = function (item, element) {
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
                    if (item.selected && (this.selectedItems[constants.NODES].size + this.selectedItems[constants.EDGES].size) === 1) {
                        this.onSelectInside(element, item, false);
                    } else {
                        this.onSelectInside(element, item, true, true);
                    }
                }
            }
            // Prevent bubbling, so that we can separately detect a click on the container
            d3.event.stopPropagation();
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onContainerClick
         * @description
         * Event handler. on a click not on a node or edge
         * Cancel current selection
         * @returns {ForceHorseFactory} current instance
         */
        proto.onContainerClick = function () {
            //console.log("Container was clicked");
            if (this.selectedItems[constants.NODES].size + this.selectedItems[constants.EDGES].size > 0) {
                this.onSelectInside(null, null, null, true);
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onHoverInside
         * @description
         * An element was hovered inside this component.
         * @param item A data object
         * @param element The corresponding DOM element
         * @param {boolean} on
         * @returns {ForceHorseFactory} current instance
         */
        proto.onHoverInside = function (element, item, on) {
            d3.select(element).classed("hovered", item.hovered = on);
            return this.callEventListeners('hover', item, on);
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onHoverOutside
         * @description
         * An element was hovered outside this component.
         * @param item data object of the hovered element
         * @returns {ForceHorseFactory} current instance
         */
        proto.onHoverOutside = function (item) {
            var itemType = (item.class === constants.CLASS_NODE ?
                constants.NODES : constants.EDGES);
            this.elements[itemType].filter(function (d) {
                    return d.id === item.id;
                })
                .classed("hovered", item.hovered);
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onSelectInside
         * @description
         * Called when an element is meant to be selected inside this component.
         * @param item The data object bound to the selected element
         * @param element The DOM element
         * @param {boolean} on Select or Unselect
         * @param {boolean} clearOldSelection whether to clear first the current selection
         * @returns {ForceHorseFactory} current instance
         */
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

            // Update the labels
            this.labels.classed("selected", function (d) {
                return d.selected;
            });

            // Update the selectedItems set
            if (item) {
                itemType = (item.class === constants.CLASS_NODE ? constants.NODES : constants.EDGES);
                if (item.selected) {
                    this.selectedItems[itemType].add(item.id);
                } else {
                    this.selectedItems[itemType].delete(item.id);
                }
            }

            // In "selectionMode" the unselected nodes are visually marked
            this.svg.classed("selectionMode",
                this.selectedItems[constants.NODES].size + myInstance.selectedItems[constants.EDGES].size);

            return this.callEventListeners('select');
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onSelectOutside
         * @description
         * API: Called when elements were selected and/or unselected outside this component.
         * @returns {ForceHorseFactory} current instance
         */
        proto.onSelectOutside = function () {
            var myInstance = this;
            // Update the "selected" css class, and the selected-items sets
            for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                (function (mySet) {
                    mySet.clear();
                    myInstance.elements[itemType]
                        .classed('selected', function (d) {
                            if (d.selected) {
                                mySet.add(d.id);
                                return true;
                            } else {
                                return false;
                            }
                        });
                }(this.selectedItems[itemType]))
            }

            // Update the labels
            this.labels.classed("selected", function (d) {
                return d.selected;
            });

            // In "selectionMode" the unselected nodes are visually marked
            this.svg.classed("selectionMode",
                this.selectedItems[constants.NODES].size + myInstance.selectedItems[constants.EDGES].size);
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onZoom
         * @description
         * Perform pan/zoom
         * @returns {ForceHorseFactory} current instance
         */
        proto.onZoom = function () {
            var trans = d3.event.translate,
                scale = d3.event.scale;

            if (this.inSvgWrapper) {
                this.inSvgWrapper.attr("transform",
                    "translate(" + trans + ")"
                    + " scale(" + scale + ")");
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onDrag
         * @description
         * Node-dragging event handler
         * @param d The data item bound to the dragged node
         * @returns {ForceHorseFactory} current instance
         */
        proto.onDrag = function (d) {
            // Make the dragged node fixed (not moved by the simulation)
            this.elements[constants.NODES].filter(function (nodeData) {
                return nodeData.id === d.id;
            }).classed("fixed", d.fixed = true);

            if (!this.isDragging) {
                this.isDragging = true;
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onDragEnd
         * @description
         * Event handler, called when a node-dragging ends
         * @returns {ForceHorseFactory} current instance
         */
        proto.onDragEnd = function () {
            this.isDragging = false;
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#toggleFixedNodesMode
         * @description
         * Called from Pause/Play button
         * Pause fixes all the nodes
         * Play unfixes all the nodes
         * @returns {ForceHorseFactory} current instance
         */
        proto.toggleFixedNodesMode = function () {
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
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onLabelsShowHideBtnClick
         * @description
         * Show or hide labels
         * Called when the labels button is clicked on
         * @returns {ForceHorseFactory} current instance
         */
        proto.onLabelsShowHideBtnClick = function () {
            //var myInstance = this;
            if (this.config.showLabels = !this.config.showLabels) {
                this.labelGroup.classed('display_none', false);
                //this.labelGroup.transition().attr("opacity", "0");
                //setTimeout(function () {
                //    myInstance.labelGroup.classed('display_none', true);
                //}, constants.ANIMATION_DELAY);
            } else { // show labels
                this.labelGroup.classed('display_none', true);
                //setTimeout(function () {
                //    myInstance.labelGroup.transition().attr("opacity", "1");
                //}, constants.ANIMATION_DELAY);
            }
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onNodeWeightShowHideBtnClick
         * @description
         * Show or hide node weights
         * Called when the node weight button is clicked on
         * @returns {ForceHorseFactory} current instance
         */
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
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#onEdgeWeightShowHideBtnClick
         * @description
         * Show or hide edge weights
         * Called when the edge weight button is clicked on
         * @returns {ForceHorseFactory} current instance
         */
        proto.onEdgeWeightShowHideBtnClick = function () {
            var myInstance = this;
            this.config.showEdgeWeight = !this.config.showEdgeWeight;
            this.elements[constants.EDGES]
                .attr("stroke-width", (!this.config.showEdgeWeight ? null : function (d) {
                    return myInstance.getEdgeWidth(d);
                }));
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#addEventListener
         * @description
         * API: Register event callbacks with this component
         * @param type The event type
         * @param callback The event listener to register
         * @returns {ForceHorseFactory} current instance
         */
        proto.addEventListener = function (type, callback) {
            if (typeof this.eventListeners[type] === 'undefined'){
                this.eventListeners[type] = [];
            }
            this.eventListeners[type].push(callback);
            return this;
        };

        /**
         * @ngdoc method
         * @name forceHorse.factory:ForceHorseFactory#callEventListeners
         * @description
         * Call the registered event listeners, for an event type
         * @param type The event type (hover, select, ...)
         * @param args Arguments for the event listener
         * @returns {ForceHorseFactory} current instance
         */
        proto.callEventListeners = function (type, ...args) {
            if (typeof this.eventListeners[type] === 'undefined'){
                return;
            }
            this.eventListeners[type].forEach(function (callback) {
                callback(...args);
            });
            return this;
        };


            /**
             * @ngdoc method
             * @name forceHorse.factory:ForceHorseFactory#convertFileDataFormat
             * @description api. See the method in helper.
             * @param fileData
             * @returns {*|*[]}
             */
        proto.convertFileDataFormat = function (fileData) {
            return helper.convertFileDataFormat(fileData);
        };

        //---------------------------------------------------
        return ForceHorseFactory;
    }])


    /**
     * @ngdoc constant
     * @name forceHorse.constant:ForceHorseConstants
     * @description A constants object for the forceHorse component
     */
    .constant('ForceHorseConstants', {
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
        DEFAULT_EDGE_WIDTH: 1.5,
        DEFAULT_EDGE_COLOR: 'brown',
        DEFAULT_NODE_COLOR: '#6060a0',
        NODE_MARGIN: 10,
        LABEL_DISPLACEMENT: 10,
        MAX_ZOOM: 0.5,
        MIN_ZOOM: 2,
        ANIMATION_DURATION: 1000,
        ANIMATION_DELAY: 200,
        ALEPHBET: 'abcdefghijklmnopqrstuvwxyz',
        INSTANCE_NAME_LENGTH: 5,
        MAX_ALPHA: 0.1,
        HEAVY_SIMULATION_NUM_OF_NODES: 420,
        DEFAULT_CHARGE_LIGHT: -350,
        DEFAULT_CHARGE_HEAVY: -15000,
        CONFIG_FILE_NAME: 'forceHorse.json',
        get node_size_addition_per_weight_unit() {
            return this.INNER_SVG_WIDTH * this.INNER_SVG_HEIGHT / (54 * 48 * 3);
        }
    })


    /**
     * @ngdoc service
     * @name forceHorse.service:ForceHorseHelper
     * @description A helper object with methods for the forceHorse component
     */
    //---------------------------------------------------------------//
    .service('ForceHorseHelper', ['ForceHorseConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
        return {

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#addButtons
             * @description
             * Add a buttons bar, at the top of the container
             * @returns {ForceHorseHelper} current object
             */
            addButtons: function (scope, container) {
                var template = templates.get('forceHorse/buttons');
                var element = angular.element(template);
                var compiledElement = $compile(element)(scope);
                container.prepend(compiledElement);
                console.log('Added buttons');
                return this;
            },

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#calcRightAngledOffset
             * @description
             * Calculate where to display edges, for the case of multiple edges between two nodes
             * @param basicOffset The desired distance from the parallel edge to the first edge
             * @param origDx The x-difference between the two end points of the first edge
             * @param origDy The y-difference between the two end points of the first edge
             * @returns {Object} <tt>{dx:dx, dy:dy}</tt> The calculated offset of the parallel edge from the first edge
             */
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
                if (!angular.isNumber(dx)) {
                    console.warn(`calcRightAngledOffset: dx is not a number! basicOffset=${basicOffset} origDx=${origDx} origDy=${origDy}`);
                }
                return {dx: dx, dy: dy};
            },

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#computeFrictionParameter
             * @description
             * Compute the friction parameter for the force-simulation, with a mysterious formula supplied by Omer.
             * @param {number} width_in_pixels Width of the simulation area
             * @param {number} height_in_pixels Height of the simulation area
             * @param {number} number_of_nodes No. of nodes in the graph
             * @returns {number}
             */
            computeFrictionParameter: function (width_in_pixels, height_in_pixels, number_of_nodes) {
                var A = 0.0356,
                    B = 1.162,
                    x = 100 * number_of_nodes / (height_in_pixels * width_in_pixels);
                if (x < 0.0634) x = 0.0634;
                return A * Math.pow(x, -B);
            },

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#isHebrewString
             * @description
             * Does the given string start with a hebrew letter?
             * @param {string} s
             * @returns {boolean}
             */
            isHebrewString: function (s) {
                var c = s.charAt(0);
                return (c >= 'א' && c <= 'ת');
            },

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#getCurrentDirectory
             * @description
             * See http://stackoverflow.com/a/21103831/4402222
             * @returns {string}
             */
/*
            getCurrentDirectory: () => {
                var scripts = document.getElementsByTagName("script");
                var currentScriptPath = scripts[scripts.length-1].src;
                return currentScriptPath.substring(0,currentScriptPath.lastIndexOf("/")+1 );
            },
*/

            /**
             * @ngdoc method
             * @name forceHorse.service:ForceHorseHelper#convertFileDataFormat
             * @param fileData
             * @returns {*[]}
             * @description
             * fileData is supposed to be in the format
             * {nodes: [nodeData, nodeData, ...] links: [linkData, linkData, ...]}
             * "edges" are also allowed, in place of "links".
             * If nodeData does not contain an id property, its id is set to its index in the array.
             * If nodeData does not contain a label property, it gets a default label.
             * A "class" property (node class) is also added to each nodeData.
             * If linkData does not contain an id property, its id is set to its index in the array.
             * If linkData does not contain an sourceID property, sourceID is set to source.
             * If linkData does not contain an targetID property, targetID is set to target.
             * A "class" property (link class) is also added to each linkData.
             * Also sourceLabel, targetLabel.
             * The resulting data is returned restructured like:
             * [ {id: constants.NODES_ID, data: nodesArray}, {id: constants.LINKS_ID, data: linksArray} ]
             ]
             */
            convertFileDataFormat: function (fileData) {
                // Process nodes
                var nodes = fileData.nodes;
                nodes.forEach(function (node, idx) {
                    if (angular.isUndefined(node.id)) {
                        node.id = idx;
                    }
                    if (angular.isUndefined(node.label)) {
                        node.label = "" + node.id;
                    }
                    node.class = constants.CLASS_NODE;
                });
                // Process edges
                var edges = (fileData.edges ? fileData.edges : fileData.links);
                edges.forEach( function(edge, idx) {
                    if (angular.isUndefined(edge.id)) {
                        edge.id = idx;
                    }
                    if (angular.isUndefined(edge.sourceID)) {
                        edge.sourceID = edge.source;
                    }
                    if (angular.isUndefined(edge.targetID)) {
                        edge.targetID = edge.target;
                    }
                    edge.sourceLabel = edge.sourceID;
                    edge.targetLabel = edge.targetID;
                    edge.class = constants.CLASS_EDGE;
                });
                // Return the (processed) data
                return    [
                    {id: constants.NODES_ID, data: nodes},
                    {id: constants.EDGES_ID, data: edges}
                ];
            }


        }; // return {
    }]) // .service
;
