// ngCesiumHelloWorldExtension - an ngCesium extension example
/**
 * @ naming conventions:
 * module name: starts with ngCesium, camelcase
 * directive name: as the name of the extension module, without the ng, camelcase
 * factory name: as the name of the directive, with Factory in the end, camelcase
 */
angular.module('ngCesiumHelloWorldExtension', ['ngCesium'])
    .directive('cesiumHelloWorldExtension', function(cesiumHelloWorldExtensionFactory){
        return {
            restrict: 'A',
            require: 'cesiumDirective',
            link: function(scope, element, attr, ctrl){
                // create the extension's instance and add it to our cesium instance controller for reference
                ctrl.cesiumHelloWorldExtension = new cesiumHelloWorldExtensionFactory(ctrl.cesiumDirective.cesiumInstance);
            }
        };
    })
    .factory('cesiumHelloWorldExtensionFactory', function($q){
        // constructor
        function cesiumHelloWorldExtensionFactory(ngCesiumInstance){
            var that = this;
            // cross reference to the instances
            that.ngCesiumInstance = ngCesiumInstance;
            ngCesiumInstance.cesiumHelloWorldExtension = that;
        }

        // extension business logic comes here
        cesiumHelloWorldExtensionFactory.prototype = {

        };

        // return the constructor
        return cesiumHelloWorldExtensionFactory;
    });