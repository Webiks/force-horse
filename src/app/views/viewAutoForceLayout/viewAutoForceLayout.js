'use strict';

angular.module('viewAutoForceLayout', ['ui.router', 'autoForceLayout'])

    //---------------------------------------------------------------//
    .config(['$stateProvider', function ($stateProvider) {
        //.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.viewAutoForceLayout', {
            url: '/viewAutoForceLayout',
            templateUrl: 'app/views/viewAutoForceLayout/viewAutoForceLayout.html',
            controller: 'view3Ctrl as ctrl',
            data: {
                title: 'Auto Force Layout'
            }
        });
    }])

    //---------------------------------------------------------------//
    .controller('view3Ctrl', ['$scope','$http', 'graphData', 'ViewAutoForceLayoutConstants', function ($scope, $http, graphData, constants) {
        //console.log('In view3Ctrl');
        var vm = this;

        // Set the options, which are passed as a parameter to the directive
        vm.options = {};

        vm.options.data = graphData.getRandomData(vm.numOfNodes = constants.INITIAL_NUM_OF_NODES);

        // Watch the variable where the directive will reference its instance.
        // Register my event handlers when the directive is ready
        $scope.$watch(function () {
            return vm.options.autoForceLayoutInstance;
        }, function(newValue) {
            newValue.addEventListener.call(newValue, 'hover', vm.onHoverOutside)
                .addEventListener.call(newValue, 'select', vm.onSelectOutside);
        });

        // Other initializations
        vm.setArrays = function () {
            vm.data = [];
            vm.data[constants.NODES] = vm.options.data[constants.NODES].data;
            vm.data[constants.EDGES] = vm.options.data[constants.EDGES].data;
        };
        vm.setArrays();

        vm.NODES = constants.NODES;
        vm.EDGES = constants.EDGES;

        vm.createRandomGraph = function () {
            vm.options.data = graphData.getRandomData(vm.numOfNodes);
            vm.setArrays();
            vm.options.autoForceLayoutInstance.redraw();
        };

        vm.createGraphFromFile = function () {
            var f = event.target.files[0];
            if (f) {
                var r = new FileReader();
                r.onload = function(evt2) {
                    var data = JSON.parse(evt2.target.result);
                    vm.options.data = graphData.getDataFromFile(data);
                    vm.setArrays();
                    vm.numOfNodes = vm.data[constants.NODES].length; // show no. of nodes on screen
                    vm.options.autoForceLayoutInstance.redraw();
                };
                r.readAsText(f);
            } else {
                console.warn(`File read error`);
            }
        };

        //vm.graphDataFileName = "";
        //vm.createGraphFromFile = function () {
        //    $http.get(vm.graphDataFileName)
        //        .then(function (response) {
        //            vm.options.data = graphData.getDataFromFile(response.data);
        //            vm.setArrays();
        //            vm.numOfNodes = vm.data[constants.NODES].length; // show no. of nodes on screen
        //            vm.options.autoForceLayoutInstance.redraw();
        //        },
        //        function(response) {
        //            console.warn(`File read error: status = ${response.status}, message = ${response.statusText}`);
        //        });
        //};

        vm.selectedItems = [new Set(), new Set()]; // selected nodes, edges

        //----- Event handlers -----//

        // An element was hovered inside this view
        vm.onHoverInside = function (item, on) {
            item.hovered = on;
            vm.setHoverState(item);
            if (angular.isDefined(vm.options.autoForceLayoutInstance)) {
                vm.options.autoForceLayoutInstance.onHoverOutside(item);
            }
        };

        // An element was hovered outside this view (in the graph component)
        vm.onHoverOutside = function (item) {
            $scope.$apply(function () {
                //console.log("onHoverOutside: label=" + item.label + " hovered=" + item.hovered);
                vm.setHoverState(item);
            });
        };

        // Update hover-related fields
        vm.setHoverState = function (item) {
            if (item) {
                if (item.hovered) {
                    if (item.class === constants.CLASS_NODE) {
                        vm.lastHoveredNode = item;
                    } else if (item.class === constants.CLASS_EDGE) {
                        vm.lastHoveredEdge = item;
                    }
                }
            }
        };

        // An element was clicked on
        vm.onClick = function (event, item) {
            var element = event.currentTarget;
            // If the Ctrl key was pressed during the click ..
            // If the clicked element was marked as selected, unselect it, and vice versa
            if (event.ctrlKey) {
                vm.onSelectInside(element, item, !item.selected);
            } else {
                // If the Ctrl key was not pressed ..
                // If the clicked node is selected, ignore the click
                // Else, clear the current selection, and select the clicked node
                if (!item.selected) {
                    vm.onSelectInside(element, item, true, true);
                }
            }
        };

        // Elements were selected inside this view
        vm.onSelectInside = function (element, item, on, clearOldSelection) {
            var itemType = (item.class === constants.CLASS_NODE ? constants.NODES : constants.EDGES);

            if (clearOldSelection) {
                vm.data[itemType].filter(function (d) {
                    return vm.selectedItems[itemType].has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                vm.selectedItems[itemType].clear();
            }

            // Update the selectedItems set
            if (item.selected = on) {
                vm.selectedItems[itemType].add(item.id);
            } else {
                vm.selectedItems[itemType].delete(item.id);
            }

            if (angular.isDefined(vm.options.autoForceLayoutInstance)) {
                vm.options.autoForceLayoutInstance.onSelectOutside();
            }
        };

        // Elements were selected and/or unselected somewhere
        vm.onSelectOutside = function () {
            $scope.$apply(function () {
                for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                    vm.selectedItems[itemType].clear();
                    vm.data[itemType].forEach(function (item) {
                        if (item.selected) {
                            vm.selectedItems[itemType].add(item.id);
                        }
                    });
                }
            });
        };

        // Elements were filtered out somewhere
        vm.onFilterOutside = function () {
            $scope.$apply(); // refresh watchers
        };

    }]) // .controller


    //---------------------------------------------------------------//
    .service('graphData', ['ViewAutoForceLayoutConstants', function (constants) {
        return {
            //---------------------------------------------------
            // get
            // Get random data for the graph
            //---------------------------------------------------
            getRandomData: function (numOfNodes) {
                var graphData = [
                    {id: constants.NODES_ID, data: []},
                    {id: constants.EDGES_ID, data: []}
                ];

                // Generate a random graph

                var i, node, edge, nodeIdx,
                    alephbet = "abcdefghijklmnopqrstuvwxyz0123456789",
                    //alephbet = "abcdefghijklmnopqrstuvwxyz0123456789אבגדהוזחטיכלמנסעפצקרשת",
                shapes = d3.svg.symbolTypes;
                for (i = 0; i < numOfNodes; i++) {
                    node = graphData[constants.NODES].data[i] = {};
                    node.class = constants.CLASS_NODE;
                    node.label = (new Array(constants.LABEL_LENGTH)).fill(null).map(function() { return alephbet.charAt(Math.floor(Math.random() * alephbet.length)); }).join('');
                    //node.label = Math.random().toString(36).slice(2).substr(0, 5); // a random string, 5 chars
                    node.shape = shapes[Math.floor(Math.random() * shapes.length)];
                    node.id = i;
                    node.color = '#' + Math.floor(Math.random() * constants.MAX_COLOR).toString(16);
                    node.weight = constants.MIN_WEIGHT + Math.floor(Math.random() * (constants.MAX_WEIGHT - constants.MIN_WEIGHT + 1));
                }

                var numEdges = numOfNodes * 3 / 2;
                for (i = 0; i < numEdges; i++) {
                    edge = graphData[constants.EDGES].data[i] = {};
                    edge.class = constants.CLASS_EDGE;
                    nodeIdx = Math.floor(Math.random() * numOfNodes);
                    edge.sourceID = graphData[constants.NODES].data[nodeIdx].id;
                    edge.sourceLabel = graphData[constants.NODES].data[nodeIdx].label;
                    nodeIdx = Math.floor(Math.random() * numOfNodes);
                    edge.targetID = graphData[constants.NODES].data[nodeIdx].id;
                    edge.targetLabel = graphData[constants.NODES].data[nodeIdx].label;
                    edge.id = i;
                    edge.color = '#' + Math.floor(Math.random() * constants.MAX_COLOR).toString(16);
                    edge.weight = constants.MIN_WEIGHT + Math.floor(Math.random() * (constants.MAX_WEIGHT - constants.MIN_WEIGHT + 1));
                }

                return graphData;
            },


            //---------------------------------------------------
            // getDataFromFile
            //---------------------------------------------------
            getDataFromFile: function (fileData) {
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

        }; // return
    }])
    /*
     "nodes": [
     {id: 0, label: 'aaa'},
     {id: 1, label: 'bbb'},
     {id: 2, label: 'ccc'},
     {id: 3, label: 'ddd'},
     {id: 4, label: 'eee'},
     {id: 5, label: 'fff'},
     {id: 6, label: 'ggg'},
     {id: 7, label: 'hhh'},
     {id: 8, label: 'iii'},
     {id: 9, label: 'jjj'},
     {id: 10, label: 'kkk'},
     {id: 11, label: 'lll'},
     {id: 12, label: 'mmm'}
     ],
     "edges": [
     {id: 0, "sourceID": 0, "targetID": 1},
     {id: 1, "sourceID": 1, "targetID": 2},
     {id: 2, "sourceID": 2, "targetID": 0},
     {id: 3, "sourceID": 1, "targetID": 3},
     {id: 4, "sourceID": 3, "targetID": 2},
     {id: 5, "sourceID": 3, "targetID": 4},
     {id: 6, "sourceID": 4, "targetID": 5},
     {id: 7, "sourceID": 5, "targetID": 6},
     {id: 8, "sourceID": 5, "targetID": 7},
     {id: 9, "sourceID": 6, "targetID": 7},
     {id: 10, "sourceID": 6, "targetID": 8},
     {id: 11, "sourceID": 7, "targetID": 8},
     {id: 12, "sourceID": 9, "targetID": 4},
     {id: 13, "sourceID": 9, "targetID": 11},
     {id: 14, "sourceID": 9, "targetID": 10},
     {id: 15, "sourceID": 10, "targetID": 11},
     {id: 16, "sourceID": 11, "targetID": 12},
     {id: 17, "sourceID": 12, "targetID": 10}
     ]
     };
     */


    //---------------------------------------------------------------//
    .constant('ViewAutoForceLayoutConstants', {
        INITIAL_NUM_OF_NODES: 20,
        MAX_COLOR: parseInt("0xffffff"),
        NODES: 0,
        EDGES: 1,
        NODES_ID: 1,
        EDGES_ID: 2,
        CLASS_NODE: 'Node',
        CLASS_EDGE: 'Edge',
        MIN_WEIGHT: 0,
        MAX_WEIGHT: 4,
        LABEL_LENGTH: 5
    })


    //---------------------------------------------------------------//
        // A special on-change attribute for <input type="file">
        // which is not currently supported by angular's ng-change.
        // Borrowed from http://stackoverflow.com/a/19647381/4402222
    //---------------------------------------------------------------//
    .directive('fileInputOnChange', function() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeFunc = scope.$eval(attrs.fileInputOnChange);
            element.bind('change', onChangeFunc);
        }
    }
});
