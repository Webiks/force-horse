'use strict';

angular.module('viewAutoForceLayout', ['ui.router', 'autoForceLayout'])

    //---------------------------------------------------------------//
    .config(['$stateProvider', function ($stateProvider) {
        //.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.viewAutoForceLayout', {
            url: '/viewAutoForceLayout',
            templateUrl: 'app/views/viewAutoForceLayout/viewAutoForceLayout.html',
            controller: 'view3Ctrl as viewCtrl',
            data: {
                title: 'Auto Force Layout'
            }
        });
    }])

    //---------------------------------------------------------------//
    .controller('view3Ctrl', ['$scope', '$http', 'graphData', 'ViewAutoForceLayoutConstants', function ($scope, $http, graphData, constants) {
        //console.log('In view3Ctrl');

        $scope.options = {};
        $scope.options.data = graphData.getRandomData($scope.numOfNodes = constants.INITIAL_NUM_OF_NODES);
        $scope.setArrays = function () {
            $scope.data = [];
            $scope.data[constants.NODES] = $scope.options.data[constants.NODES].data;
            $scope.data[constants.EDGES] = $scope.options.data[constants.EDGES].data;
        };
        $scope.setArrays();
        $scope.NODES = constants.NODES;
        $scope.EDGES = constants.EDGES;

        $scope.createRandomGraph = function () {
            $scope.options.data = graphData.getRandomData($scope.numOfNodes);
            $scope.setArrays();
            $scope.options.autoForceLayoutInstance.redraw();
        };

        $scope.graphDataFileName = "";
        $scope.createGraphFromFile = function () {
            $http.get($scope.graphDataFileName)
                .then(function (response) {
                    $scope.options.data = graphData.getDataFromFile(response.data);
                    $scope.setArrays();
                    $scope.numOfNodes = $scope.data[constants.NODES].length; // show no. of nodes on screen
                    $scope.options.autoForceLayoutInstance.redraw();
                },
                function(response) {
                    console.warn(`File read error: status = ${response.status}, message = ${response.statusText}`);
                });
        };

        $scope.selectedItems = [new Set(), new Set()]; // selected nodes, edges

        //----- Event handlers -----//

        // An element was hovered inside this view
        $scope.onHoverInside = function (item, on) {
            item.hovered = on;
            $scope.setHoverState(item);
            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.onHoverOutside(item);
            }
        };

        // An element was hovered outside this view (in the graph component)
        $scope.onHoverOutside = function (item) {
            $scope.setHoverState(item);
        };

        // Update hover-related fields
        $scope.setHoverState = function (item) {
            if (item) {
                if (item.hovered) {
                    if (item.class === constants.CLASS_NODE) {
                        $scope.lastHoveredNode = item;
                    } else if (item.class === constants.CLASS_EDGE) {
                        $scope.lastHoveredEdge = item;
                    }
                }
            }
        };

        // An element was clicked on
        $scope.onClick = function (event, item) {
            var element = event.currentTarget;
            // If the Ctrl key was pressed during the click ..
            // If the clicked element was marked as selected, unselect it, and vice versa
            if (event.ctrlKey) {
                $scope.onSelectInside(element, item, !item.selected);
            } else {
                // If the Ctrl key was not pressed ..
                // If the clicked node is selected, ignore the click
                // Else, clear the current selection, and select the clicked node
                if (!item.selected) {
                    $scope.onSelectInside(element, item, true, true);
                }
            }
        };

        // Elements were selected inside this view
        $scope.onSelectInside = function (element, item, on, clearOldSelection) {
            var itemType = (item.class === constants.CLASS_NODE ? constants.NODES : constants.EDGES);

            if (clearOldSelection) {
                $scope.data[itemType].filter(function (d) {
                    return $scope.selectedItems[itemType].has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                $scope.selectedItems[itemType].clear();
            }

            // Update the selectedItems set
            if (item.selected = on) {
                $scope.selectedItems[itemType].add(item.id);
            } else {
                $scope.selectedItems[itemType].delete(item.id);
            }

            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.onSelectOutside();
            }
        };

        // Elements were selected and/or unselected somewhere
        $scope.onSelectOutside = function () {
            for (var itemType = constants.NODES; itemType <= constants.EDGES; itemType++) {
                $scope.selectedItems[itemType].clear();
                $scope.data[itemType].forEach(function (item) {
                    if (item.selected) {
                        $scope.selectedItems[itemType].add(item.id);
                    }
                });
            }
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

                var i, node, edge, nodeIdx;
                var shapes = d3.svg.symbolTypes;
                for (i = 0; i < numOfNodes; i++) {
                    node = graphData[constants.NODES].data[i] = {};
                    node.class = constants.CLASS_NODE;
                    node.label = Math.random().toString(36).slice(2).substr(0, 5); // a random string, 5 chars
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
                //var graphData =
                return    [
                    {id: constants.NODES_ID, data: fileData.nodes},
                    {id: constants.EDGES_ID, data: fileData.links}
                ];
                //return graphData;
                // TODO: automatic fixing of property names?
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
        MAX_WEIGHT: 4
    })
;