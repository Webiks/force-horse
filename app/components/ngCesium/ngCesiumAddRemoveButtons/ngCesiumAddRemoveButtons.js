'use strict';

// define the ngCesium module
angular.module('ngCesiumAddRemoveButtons', ['ngCesium'])
    //define the cesium directive
    .directive('cesiumAddRemoveButtonsDirective', ['$interval', 'cesiumAddRemoveButtonsService', function($interval, cesiumAddRemoveButtonsService){
        // return the directive definition object
        return {
            restrict: "EA",
            require: "cesiumDirective",
            controller: function($scope){

            },
            // define the "link" function
            link: function(scope, element, attr, ctrl){
                new cesiumAddRemoveButtonsService(ctrl.cesiumDirective.cesiumInstance);
            }
        };
    }])

    // define the cesium factory
    .factory('cesiumAddRemoveButtonsService', [function(){
        // constructor
        function cesiumAddRemoveButtonsService(cesiumInstance){
            this.cesiumInstance = cesiumInstance;
            cesiumInstance._addRemoveButtons = this;
        }

        cesiumAddRemoveButtonsService.prototype = {
            addButtonCall: function addButtonCall(options){
                var options = {
                    id: 'entity_' + (Math.random() * 100).toFixed(2),
                    point: {
                        pixelSize: 32
                    },
                    position: new Cesium.Cartesian3.fromDegrees((98+Math.random()*5) * 180/Math.PI, (47+Math.random()*5) * 180/Math.PI, 500)
                };

                this.cesiumInstance.addEntity(options);
            },
            removeButtonCall: function removeButtonCall(id){
                var entityId = this.cesiumInstance._viewer.entities.values[Math.round(Math.random()*(this.cesiumInstance._viewer.entities.values.length-1))].id;
                this.cesiumInstance.removeEntity(entityId);
            }
        };

        return cesiumAddRemoveButtonsService;
    }]);