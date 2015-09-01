'use strict';

// define the ngCesium module
angular.module('ngCesium', [])
    //define the cesium directive
    .directive('cesiumDirective', ['$interval', 'cesiumService', function($interval, cesiumService){
        // return the directive definition object
        return {
            priority: 500,
            restrict: "EA",
            controllerAs: "cesiumCtrl",
            scope: {
                cesiumDirective: "="
            },
            controller: function($scope, $element){
                var ctrl = this;
                // create the viewer
                ctrl.cesium = new Cesium.Viewer($element[0], {
                    baseLayerPicker: false,
                    fullscreenButton: false,
                    homeButton: false,
                    sceneModePicker: false,
                    selectionIndicator: false,
                    timeline: false,
                    animation: false,
                    geocoder: false
                });

                // handle the case in which no config is sent
                if (angular.isUndefined(ctrl.cesiumDirective)){
                    ctrl.cesiumDirective = {};
                }
                // this makes sure our parent app gets its cesiumInstance back
                ctrl.cesiumDirective.cesiumInstance = new cesiumService(ctrl.cesium);
            },
            // define the "link" function
            link: function(scope, element, attr, ctrl){}
        };
    }])

    // define the cesium factory
    .factory('cesiumService', [function(){
        // constructor
        function cesiumService(viewer){
            this._viewer = viewer;
        }

        cesiumService.prototype = {
            addEntity: function addEntity(options){
                this._viewer.entities.add(options);
            },
            removeEntity: function removeEntity(id){
                this._viewer.entities.removeById(id);
            }
        };

        return cesiumService;
    }]);