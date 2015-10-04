'use strict';

angular.module('myApp.view2', ['ui.router'])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.polygonDrawer', {
            url: '/polygon-drawer',
            data: {
                title: 'Polygon Drawer'
            },
            views: {
                "": {
                    templateUrl: 'app/views/polygonDrawer/view.html',
                    controller: 'polygonDrawerCtrl as viewCtrl'
                },
                "dataView@index.polygonDrawer": {
                    templateUrl: 'app/views/polygonDrawer/dataView.html'
                    // inherits the controller from the parent view... hence, using the same cesium instance
                }
            }
        });
    }])

    .controller('polygonDrawerCtrl', [function () {

        function resolve(polygon) {
            vm.drawing = false;
        }

        function notify(polygon) {
            // do something with the polygon
        }

        var vm = this;

        vm.cesiumConfig = {
            config: {
                baseLayerPicker: false,
                fullscreenButton: false,
                homeButton: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                animation: false,
                geocoder: false
            }
        };

        vm.stopDrawing = function () {
            vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.stopDrawing();
        };

        vm.draw = function () {
            vm.drawing = true;

            var promise = vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.startDrawing();
            promise.then(resolve, null, notify);
        };
    }]);