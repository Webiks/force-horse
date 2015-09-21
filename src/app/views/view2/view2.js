'use strict';

angular.module('myApp.view2', ['ui.router'])

.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('index.view2', {
        url: '/view2',
        templateUrl: 'app/views/view2/view2.html',
        controller: 'view2Ctrl as viewCtrl',
        data: {
            title: 'View 2'
        }
    });
}])

    .controller('view2Ctrl', [function () {

        function resolve(polygon){
            vm.drawing = false;
        }

        function notify(polygon){
            // do something with the polygon
        }

        var vm = this;

        /*vm.cesiumConfig = {
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
        };*/

        vm.stopDrawing = function(){
            vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.stopDrawing();
        };

        vm.draw = function(){
            vm.drawing = true;

            var promise = vm.cesiumConfig.cesiumInstance.cesiumPolygonDrawer.startDrawing();
            promise.then(resolve, null, notify);
        };
    }]);