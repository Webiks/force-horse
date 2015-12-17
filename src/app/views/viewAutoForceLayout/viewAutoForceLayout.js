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
    .controller('view3Ctrl', ['$scope', 'graphData', function ($scope, data) {
        //console.log('In view3Ctrl');

        $scope.options = {};
        $scope.options.data = data.get();

        $scope.selectedNodes = new Set();

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
            nodeObj = $scope.options.data.nodes.find(function (node) {
                return node.id === nodeObj.id;
            });
            nodeObj.hovered = on;
            if (on) {
                $scope.lastHoveredNode = nodeObj;
            }
        };

        // Link was hovered inside this view
        $scope.inSetLinkHovered = function (linkObj, on) {
            linkObj.hovered = on;
            if (on) {
                $scope.lastHoveredLink = linkObj;
            }
            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.apiSetLinkHovered(linkObj, on);
            }
        };

        // Link was hovered outside this view (in the graph component)
        $scope.setLinkHovered = function (linkObj, on) {
            linkObj = $scope.options.data.links.find(function (link) {
                return link.id === linkObj.id;
            });
            linkObj.hovered = on;
            if (on) {
                $scope.lastHoveredLink = linkObj;
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
                    return $scope.selectedNodes.has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                $scope.selectedNodes.clear();
            }

            // Update the selectedNodes set
            if (nodeData.selected = on) {
                $scope.selectedNodes.add(nodeData.id);
            } else {
                $scope.selectedNodes.delete(nodeData.id);
            }

            if (angular.isDefined($scope.options.autoForceLayoutInstance)) {
                $scope.options.autoForceLayoutInstance.apiSetNodeSelected(nodeData, on, clearOldSelection);
            }
        };

        $scope.setNodeSelected = function (nodeData, on, clearOldSelection) {

            if (clearOldSelection) {
                $scope.options.data.nodes.filter(function (d) {
                    return $scope.selectedNodes.has(d.id);
                }).forEach(function (d) {
                    d.selected = false;
                });
                $scope.selectedNodes.clear();
            }

            if (nodeData) {
                // Get the inner node object that corresponds the node object parameter
                nodeData = $scope.options.data.nodes.find(function (node) {
                    return node.id === nodeData.id;
                });

                nodeData.selected = on;

                // Update the selectedNodes set
                if (nodeData.selected) {
                    $scope.selectedNodes.add(nodeData.id);
                } else {
                    $scope.selectedNodes.delete(nodeData.id);
                }
            }
        };


    }])

    //---------------------------------------------------------------//
    .service('graphData', function () {
        return {
            get: function () {
                var graph = {
                    nodes: [], links: []
                };
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
                    "links": [
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

                // Generate a random graph ...

                const numNodes = 30;
                //const numNodes = 12;
                var i, node, link;
                for (i = 0; i < numNodes; i++) {
                    node = graph.nodes[i] = {};
                    node.id = i;
                    node.label = Math.random().toString(36).slice(2).substr(0,5);
                }

                var numLinks = numNodes * 3 / 2;
                for (i = 0; i < numLinks; i++) {
                    link = graph.links[i] = {};
                    link.id = i;
                    link.sourceID = graph.nodes[Math.floor(Math.random()*numNodes)].id;
                    link.targetID = graph.nodes[Math.floor(Math.random()*numNodes)].id;
                }

                // Add some random attributes

                var maxColor = parseInt("0xffffff");
                var shapes = d3.svg.symbolTypes;
                //var shapes = ['circle', 'cross', 'diamond', 'square', 'triangle-down', 'triangle-up'];
                graph.nodes.forEach(function (node) {
                    node.color = '#' + Math.floor(Math.random() * maxColor).toString(16);
                    node.shape = shapes[Math.floor(Math.random() * shapes.length)];
                });
                //-----//
                return graph;
            }
        };
    })
;