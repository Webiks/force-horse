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
    .directive('autoForceLayout', ['$compile', 'AutoForceLayoutFactory', 'AutoForceLayoutServices', function ($compile, AutoForceLayoutFactory, internal) {
        return {
            restrict: "EA",
            controllerAs: "autoForceLayoutCtrl",
            priority: 100,
            scope: {
                options: "="
            },
            bindToController: true,
            controller: function ($scope, $element) {
                console.log('In autoForceLayout controller');
                // this makes sure our parent app gets its echoInstance back
                this.options.autoForceLayoutInstance = new AutoForceLayoutFactory()
                    .initLayout($element, this.options)
                    .redraw();
            },
            link: function (scope, element) { //, attr, ctrl) {
                console.log('In autoForceLayout link');
                // Add CSS class to set a CSS "namespace"
                element.addClass("auto-force-layout");
                element.attr("layout", "column");
                element.attr("flex", "");
                internal.addButtons(scope, element);
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
                .attr("class", "link");

            // draw nodes
            this.nodes = this.svg.selectAll(".node")
                .data(this.data.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 12)
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
            addButtons: function(scope, container) {
                var template = templates.get('autoForceLayout/buttons');
                var element = angular.element(template);
                var compiledElement = $compile(element)(scope);
                container.prepend(compiledElement);
            }

        }; // return {
    }]) // .service
;
