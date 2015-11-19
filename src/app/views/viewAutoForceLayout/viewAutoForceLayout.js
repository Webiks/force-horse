'use strict';

angular.module('viewAutoForceLayout', ['ui.router', 'autoForceLayout'])

    //---------------------------------------------------------------//
    .config(['$stateProvider', function ($stateProvider) {
        //.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.viewAutoForceLayout', {
            url: '/viewAutoForceLayout',
            templateUrl: 'app/views/viewAutoForceLayout/viewAutoForceLayout.html',
            controller: 'autoCtrl as viewCtrl',
            data: {
                title: 'Auto Force Layout'
            }
        });
    }])

    //---------------------------------------------------------------//
    .controller('autoCtrl', ['$scope', 'graphData', function ($scope, data) {
        console.log('In mainAppCtrl');
        $scope.options = {};
        $scope.options.data = data.get();
    }])

    //---------------------------------------------------------------//
    .service('graphData', function() {
        return {
            get: function() {
                return {
                    "nodes": [
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {},
                        {}
                    ],
                    "links": [
                        {"source":  0, "target":  1},
                        {"source":  1, "target":  2},
                        {"source":  2, "target":  0},
                        {"source":  1, "target":  3},
                        {"source":  3, "target":  2},
                        {"source":  3, "target":  4},
                        {"source":  4, "target":  5},
                        {"source":  5, "target":  6},
                        {"source":  5, "target":  7},
                        {"source":  6, "target":  7},
                        {"source":  6, "target":  8},
                        {"source":  7, "target":  8},
                        {"source":  9, "target":  4},
                        {"source":  9, "target": 11},
                        {"source":  9, "target": 10},
                        {"source": 10, "target": 11},
                        {"source": 11, "target": 12},
                        {"source": 12, "target": 10}
                    ]
                };
            }
        };
    })
;