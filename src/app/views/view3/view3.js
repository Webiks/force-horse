'use strict';

angular.module('myApp.view3', ['ui.router', 'ngCesiumFilter'])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.view3', {
            url: '/view3',
            templateUrl: 'app/views/view3/view3.html',
            controller: 'view3Ctrl as viewCtrl',
            data: {
                title: 'View 3'
            }
        });
    }])

    .controller('view3Ctrl', [function () {

        function filterByPolygon(polygon) {
            function hideIfNotInPolygon(entity, state) {
                entity.show = state;
            }

            vm.cesiumConfig.cesiumInstance.areInsidePolygon('', polygon, hideIfNotInPolygon)
        }

        function resolve(polygon) {
            // stop drawing
            vm.drawing = false;

            //

        }

        function notify(polygon) {
            // get the polygon and


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

        vm.createData = function (n) {
            if (angular.isUndefined(n)){
                n = 1000;
            }

            for (var i = 0; i < n; i++) {
                vm.cesiumConfig.cesiumInstance.addEntity({
                    id: _.uniqueId(i.toString() + '_'),
                    position: Cesium.Cartesian3.fromDegrees(
                        (Math.random() * 9) + 10,
                        (Math.random() * 9) - 1,
                        0),
                    billboard: {
                        image: vm.cesiumConfig.cesiumInstance.createPin()
                    }
                });
            }
        }
    }]);