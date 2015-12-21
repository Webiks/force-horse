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
    .controller('view3Ctrl', ['$scope', 'graphData', 'ViewAutoForceLayoutConstants', function ($scope, data, constants) {
        //console.log('In view3Ctrl');

        $scope.options = {data: {}};
        $scope.graph = data.get($scope.numOfNodes = constants.INITIAL_NUM_OF_NODES);
        $scope.options.data = $scope.graph.nodes.concat($scope.graph.edges);

        $scope.recreateGraph = function() {
            $scope.graph = data.get($scope.numOfNodes);
            $scope.options.data = $scope.graph.nodes.concat($scope.graph.edges);
            $scope.options.autoForceLayoutInstance.redraw();
        };

        $scope.selectedEntities = new Set();

        //----- Event handlers -----//

        // Node was hovered inside this view
        $scope.inSetNodeHovered = function (nodeObj, on) {
            nodeObj.hovered = on;
            if (on) {
                $scope.lastHoveredNode = nodeObj;
            }
            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.apiSetNodeHovered(nodeObj, on);
            }
        };

        // Node was hovered outside this view (in the graph component)
        $scope.setNodeHovered = function (nodeObj, on) {
            nodeObj = $scope.graph.nodes.find(function (node) {
                return node.id === nodeObj.id;
            });
            nodeObj.hovered = on;
            if (on) {
                $scope.lastHoveredNode = nodeObj;
            }
        };

        // Edge was hovered inside this view
        $scope.inSetEdgeHovered = function (edgeObj, on) {
            edgeObj.hovered = on;
            if (on) {
                $scope.lastHoveredEdge = edgeObj;
            }
            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.apiSetEdgeHovered(edgeObj, on);
            }
        };

        // Edge was hovered outside this view (in the graph component)
        $scope.setEdgeHovered = function (edgeObj, on) {
            edgeObj = $scope.options.data.edges.find(function (edge) {
                return edge.id === edgeObj.id;
            });
            edgeObj.hovered = on;
            if (on) {
                $scope.lastHoveredEdge = edgeObj;
            }
        };

        $scope.onNodeClicked = function(event, nodeData) {
            var element = event.currentTarget;
            // If the Ctrl key was pressed during the click ..
            // If the clicked element was marked as selected, unselect it, and vice versa
            if (event.ctrlKey) {
                $scope.inSetNodeSelected(element, nodeData, !nodeData.selected);
            } else {
                // If the Ctrl key was not pressed ..
                // If the clicked node is selected, ignore the click
                // Else, clear the current selection, and select the clicked node
                if (!nodeData.selected) {
                    $scope.inSetNodeSelected(element, nodeData, true, true);
                }
            }
        };

        $scope.inSetNodeSelected = function (element, nodeData, on, clearOldSelection) {

            if (clearOldSelection) {
                $scope.options.data.nodes.filter(function (d) {
                    return $scope.selectedEntities.has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                $scope.selectedEntities.clear();
            }

            // Update the selectedEntities set
            if (nodeData.selected = on) {
                $scope.selectedEntities.add(nodeData.id);
            } else {
                $scope.selectedEntities.delete(nodeData.id);
            }

            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.apiSetNodeSelected(nodeData, on, clearOldSelection);
            }
        };

        $scope.setNodeSelected = function (nodeData, on, clearOldSelection) {

            if (clearOldSelection) {
                $scope.options.data.nodes.filter(function (d) {
                    return $scope.selectedEntities.has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                $scope.selectedEntities.clear();
            }

            if (nodeData) {
                // Get the inner node object that corresponds the node object parameter
                nodeData = $scope.options.data.nodes.find(function (node) {
                    return node.id === nodeData.id;
                });

                nodeData.selected = on;

                // Update the selectedEntities set
                if (nodeData.selected) {
                    $scope.selectedEntities.add(nodeData.id);
                } else {
                    $scope.selectedEntities.delete(nodeData.id);
                }
            }
        };


    }])


    //---------------------------------------------------------------//
    .service('graphData', ['ViewAutoForceLayoutConstants', function (constants) {
        return {
            get: function (numOfNodes) {
                var graph = {nodes: [], edges: []};

                // Generate a random graph

                var i, node, edge, nodeIdx;
                var shapes = d3.svg.symbolTypes;
                for (i = 0; i < numOfNodes; i++) {
                    node = graph.nodes[i] = {};
                    node.class = 'Node';
                    node.label = Math.random().toString(36).slice(2).substr(0,5);
                    node.shape = shapes[Math.floor(Math.random() * shapes.length)];
                    node.id = i;
                    node.color = '#' + Math.floor(Math.random() * constants.MAX_COLOR).toString(16);
                }

                var numEdges = numOfNodes * 3 / 2;
                for (i = 0; i < numEdges; i++) {
                    edge = graph.edges[i] = {};
                    edge.class = 'Edge';
                    nodeIdx = Math.floor(Math.random()*numOfNodes);
                    edge.sourceID = graph.nodes[nodeIdx].id;
                    edge.sourceLabel = graph.nodes[nodeIdx].label;
                    nodeIdx = Math.floor(Math.random()*numOfNodes);
                    edge.targetID = graph.nodes[nodeIdx].id;
                    edge.targetLabel = graph.nodes[nodeIdx].label;
                    edge.id = i;
                    edge.color = '#' + Math.floor(Math.random() * constants.MAX_COLOR).toString(16);
                }

                return graph;
            }
        };
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
        MAX_COLOR: parseInt("0xffffff")
})
;