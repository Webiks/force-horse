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
                onLinkUnhovered: '&',
                onNodeHovered: '&',
                onNodeUnhovered: '&'
            },
            bindToController: true,
            controller: function ($scope, $element) {
                console.log('In autoForceLayout controller');

                var eventHandlers = services.applyScopeToEventHandlers(scope);
                // this makes sure our parent app gets its echoInstance back
                this.options.autoForceLayoutInstance = new AutoForceLayoutFactory()
                    .initLayout($element, this.options)
                    .redraw();
            },
            link: function (scope, element) { //, attr, ctrl) {
                console.log('In autoForceLayout link');

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
        proto.initLayout = function (element, options) {
            console.log('in initLayout()');
            var myInstance = this;

            this.options = options;
            this.data = options.data;

            this.nodesById = services.compileNodes(this.data.nodes);
            this.linksById = services.compileLinks(this.data.links, this.nodesById);

            // create a forceLayout instance
            this.force = d3.layout.force()
                .size([constants.INNER_SVG_WIDTH, constants.INNER_SVG_HEIGHT])
                .charge(-400)
                .linkDistance(40)
                .on("tick", function () {
                    services.tick(myInstance)
                });

            this.drag = this.force.drag()
                .on("dragstart", services.dragstart);

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
            console.log('in redraw()');

            // draw links
            this.links = this.svg.selectAll(".link")
                .data(this.data.links)
                .enter().append("line")
                .attr("class", "link")
                .on("mouseover", this.onLinkHovered)
                .on("mouseout", this.onLinkUnhovered);

            // draw nodes
            this.nodes = this.svg.selectAll(".node")
                .data(this.data.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 12)
                .on("mouseover", this.onNodeHovered)
                .on("mouseout", this.onNodeUnhovered)
                .on("dblclick", services.dblclick)
                .call(this.drag);

            return this;
        };

        return AutoForceLayoutFactory;
    }])

    //---------------------------------------------------------------//
    .constant('AutoForceLayoutConstants', {
        INNER_SVG_WIDTH: 640,
        INNER_SVG_HEIGHT: 480
    })


    //---------------------------------------------------------------//
    .service('AutoForceLayoutServices', ['AutoForceLayoutConstants', '$templateCache', '$compile', function (constants, templates, $compile) {
        return {
            //---------------------------------------------------
            // tick
            // Event handler
            //---------------------------------------------------
            tick: function (myInstance) {
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

                myInstance.nodes.attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            },

            //---------------------------------------------------
            // dblclick
            // Event handler
            //---------------------------------------------------
            dblclick: function (d) {
                d3.select(this).classed("fixed", d.fixed = false);
            },

            //---------------------------------------------------
            // dragstart
            // Event handler
            //---------------------------------------------------
            dragstart: function (d) {
                d3.select(this).classed("fixed", d.fixed = true);
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
            applyScopeToEventHandlers: function (scope) {
                return {

                    onLinkHovered: function (d) {
                        scope.$apply(function () {
                            scope.onLinkHovered({item: d});
                        });
                    },

                    onLinkUnovered: function (d) {
                        scope.$apply(function () {
                            scope.onLinkUnhovered({item: d});
                        });
                    },

                    onNodeHovered: function (d) {
                        scope.$apply(function () {
                            scope.onNodeHovered({item: d});
                        });
                    },

                    onNodeUnhovered: function (d) {
                        scope.$apply(function () {
                            scope.onNodeUnhovered({item: d});
                        });
                    }

                }; // return {
            }

        }; // return {
    }]) // .service
;
