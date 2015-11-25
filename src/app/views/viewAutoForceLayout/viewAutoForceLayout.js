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
        console.log('In view3Ctrl');

        $scope.options = {};
        $scope.options.data = data.get();

        // Example event handlers

        $scope.setNodeHovered = function(item, on) {
            if (on) {
                $scope.lastHoveredNode = item;
            } else {
                $scope.lastUnhoveredNode = item;
            }
        };

        $scope.setLinkHovered = function(item, on) {
            if (on) {
                $scope.lastHoveredLink = item;
            } else {
                $scope.lastUnhoveredLink = item;
            }
        };
    }])

    //---------------------------------------------------------------//
    .service('graphData', function() {
        return {
            get: function() {
                var graph = {
                    "nodes": [
                        {id:0, label:'aaa'},
                        {id:1, label:'bbb'},
                        {id:2, label:'ccc'},
                        {id:3, label:'ddd'},
                        {id:4, label:'eee'},
                        {id:5, label:'fff'},
                        {id:6, label:'ggg'},
                        {id:7, label:'hhh'},
                        {id:8, label:'iii'},
                        {id:9, label:'jjj'},
                        {id:10, label:'kkk'},
                        {id:11, label:'lll'},
                        {id:12, label:'mmm'}
                    ],
                    "links": [
                        {id:0, "sourceID":  0, "targetID":  1},
                        {id:1, "sourceID":  1, "targetID":  2},
                        {id:2, "sourceID":  2, "targetID":  0},
                        {id:3, "sourceID":  1, "targetID":  3},
                        {id:4, "sourceID":  3, "targetID":  2},
                        {id:5, "sourceID":  3, "targetID":  4},
                        {id:6, "sourceID":  4, "targetID":  5},
                        {id:7, "sourceID":  5, "targetID":  6},
                        {id:8, "sourceID":  5, "targetID":  7},
                        {id:9, "sourceID":  6, "targetID":  7},
                        {id:10, "sourceID":  6, "targetID":  8},
                        {id:11, "sourceID":  7, "targetID":  8},
                        {id:12, "sourceID":  9, "targetID":  4},
                        {id:13, "sourceID":  9, "targetID": 11},
                        {id:14, "sourceID":  9, "targetID": 10},
                        {id:15, "sourceID": 10, "targetID": 11},
                        {id:16, "sourceID": 11, "targetID": 12},
                        {id:17, "sourceID": 12, "targetID": 10}
                    ]
                };

                // Add some random attributes

                var maxColor = parseInt("0xffffff");
                var shapes = ['circle', 'cross', 'diamond', 'square', 'triangle-down', 'triangle-up'];
                graph.nodes.forEach(function (node) {
                    node.color = '#'+Math.floor(Math.random()*maxColor).toString(16);
                    node.shape = shapes[Math.floor(Math.random()*shapes.length)];
                })
                //-----//
                return graph;
            }
        };
    })
;