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

        function resolve(polygon){
            vm.drawing = false;
        }

        function notify(polygon){
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

        vm.stopDrawing = function(){
            vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.stopDrawing();
        };

        vm.draw = function(){
            vm.drawing = true;

            var promise = vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.startDrawing();
            promise.then(resolve, null, notify);
        };
    }]);