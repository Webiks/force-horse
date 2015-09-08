// define the ngCesiumPolygonDrawer module (dependant on ngCesium)
angular.module('ngCesiumPolygonDrawer', ['ngCesium'])
    .directive('cesiumPolygonDrawer', function(cesiumPolygonDrawerFactory){
        return {
            restrict: 'A',
            require: 'cesiumDirective',
            link: function(scope, element, attr, ctrl){
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);

                // add parent's controller to the scope
                isoScope.cesiumPolygonDrawerCtrl = ctrl;
                // create a cesiumButtonsInstance and add it to our controller
                isoScope.cesiumPolygonDrawerCtrl.cesiumPolygonDrawerInstance = new cesiumPolygonDrawerFactory(ctrl.cesiumDirective.cesiumInstance);
            }
        };
    })
    .factory('cesiumPolygonDrawerFactory', function($q){
        // constructor
        function cesiumPolygonDrawerFactory(ngCesiumInstance){
            var that = this;
            that.ngCesiumInstance = ngCesiumInstance;
            ngCesiumInstance.cesiumPolygonDrawer = that;

            // initialize the polygon's positions - we will add more points as we draw
            that.positions = [];

            // create the polygon entity
            var options = {
                id: 'cesium drawing polygon',
                polyline: {
                    show: true,
                    positions: ngCesiumInstance.setCallbackProperty(that.positions)
                },
                polygon: {
                    show: false,
                    hierarchy: ngCesiumInstance.setCallbackProperty(that.positions)
                }
            }

            that.polygonEntity = ngCesiumInstance.addEntity(options);

            // setup the events handler
            that.eventsHandler = ngCesiumInstance.getEventHandler();

            // setup the drawing flah
            that.currentlyDrawing = false;
        };

        cesiumPolygonDrawerFactory.prototype = {
            // this starts the drawing on the cesium viewer
            startDrawing: function(options){
                function addPolylinePoint(click){
                    var cartesian = that.ngCesiumInstance._viewer.camera.pickEllipsoid(click.position, that.ngCesiumInstance._viewer.scene.globe.ellipsoid);
                    if (!cartesian) return;
                    // reset the positions array if we start a new polygon
                    if (that.currentlyDrawing === false){
                        that.positions.length = 0;
                        that.polygonEntity.polyline.show = true;
                        that.polygonEntity.polygon.show = false;
                        that.currentlyDrawing = true;
                    }
                    that.positions.push(cartesian);
                }

                function updatePolyline(position){
                    if (that.currentlyDrawing === false) return;
                    var cartesian = that.ngCesiumInstance._viewer.camera.pickEllipsoid(position.endPosition, that.ngCesiumInstance._viewer.scene.globe.ellipsoid);
                    if (!cartesian) return;

                    if (that.positions.length > 1)
                        that.positions.splice(that.positions.length-1, 1, cartesian);
                    else
                        that.positions.push(cartesian);

                }

                function closePolygon(click){
                    that.currentlyDrawing = false; // reset the drawing status
                    that.positions.splice(that.positions.length-1, 1); // remove the last point

                    // hide polyline, show polygon
                    that.polygonEntity.polyline.show = false;
                    that.polygonEntity.polygon.show = true;

                    // send the polygon to the sending function
                    that.deferred.notify(that.polygonEntity.polygon);
                }

                var that = this;

                if (angular.isDefined(options) && angular.isDefined(options.color)){
                    that.polygonEntity.polygon.material = options.color;
                }

                // setup event listeners
                that.eventsHandler.setInputAction(addPolylinePoint, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                that.eventsHandler.setInputAction(updatePolyline, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                that.eventsHandler.setInputAction(closePolygon, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

                // setup the promise
                that.deferred = $q.defer();
                return that.deferred.promise;
            },
            stopDrawing: function(){
                var that = this;
                // destroy event listeners
                that.eventsHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                that.eventsHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                that.eventsHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

                // resolve the promise
                that.deferred.resolve(this.polygonEntity.polygon);
            }
        }

        return cesiumPolygonDrawerFactory;
    });