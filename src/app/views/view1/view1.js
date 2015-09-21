'use strict';

angular.module('myApp.view1', ['ui.router'])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.view1', {
            url: '/view1',
            data: {
                title: 'View 1'
            },
            views: {
                "": {
                    templateUrl: 'app/views/view1/view1.html'
                },
                "mapView@index.view1": {
                    templateUrl: 'app/views/view1/view1.mapView.html',
                    controller: 'view1MapCtrl as mapViewCtrl'
                },
                "dataView@index.view1": {
                    template: 'Test'
                }
            }
        })
}])

.controller('view1MapCtrl', [function () {
    this.cesiumConfig = {
        /*config: {
            baseLayerPicker: false,
            fullscreenButton: false,
            homeButton: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            animation: false,
            geocoder: false
        }*/
    }
}]);