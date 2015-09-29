'use strict';

angular.module('myApp.view1', ['ui.router'])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.cesiumUpAndRunning', {
            url: '/cesium-up-and-running',
            data: {
                title: 'Cesium up and running'
            },
            views: {
                "": {
                    templateUrl: 'app/views/cesiumUpAndRunning/view1.html'
                },
                "mapView@index.cesiumUpAndRunning": {
                    templateUrl: 'app/views/cesiumUpAndRunning/view1.mapView.html',
                    controller: 'view1MapCtrl as mapViewCtrl'
                },
                "dataView@index.cesiumUpAndRunning": {
                    template: 'Test'
                }
            }
        })
}])

.controller('view1MapCtrl', [function () {
    this.cesiumConfig = {
    }
}]);