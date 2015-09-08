// define the ngCesiumFilter module (dependant on ngCesium)
angular.module('ngCesiumClustering', ['ngCesium'])
    .directive('cesiumCluster', function(cesiumClusteringFactory){
        return {
            restrict: 'A',
            require: 'cesiumDirective',
            link: function(scope, element, attr, ctrl){
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);
                // add parent's controller to the scope
                isoScope.cesiumFilterCtrl = ctrl;
                // create a cesiumButtonsInstance and add it to our controller
                isoScope.cesiumFilterCtrl.cesiumFilterInstance = new cesiumFilterFactory(ctrl.cesiumDirective.cesiumInstance);
            }
        };
    })
    .factory('cesiumClusteringFactory', function($q){
        // constructor
        function cesiumClusteringFactory(ngCesiumInstance){
            var that = this;
            that.ngCesiumInstance = ngCesiumInstance;
            ngCesiumInstance.cesiumClusterer = that;
        }

        cesiumClusteringFactory.prototype = {

        };

        return cesiumClusteringFactory;
    });