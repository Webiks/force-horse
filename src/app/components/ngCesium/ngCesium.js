'use strict';

// define the ngCesium module
angular.module('ngCesium', [])
    //define the cesium directive
    .directive('cesiumDirective', ['$timeout', 'cesiumFactory', function ($timeout, cesiumFactory) {
        // return the directive definition object
        return {
            priority: 500,
            restrict: "EA",
            controllerAs: "cesiumCtrl",
            scope: {
                cesiumDirective: "="
            },
            bindToController: true,
            controller: function ($scope, $element) {
                var ctrl = this;

                // handle the case in which no config is sent
                if (angular.isUndefined(ctrl.cesiumDirective)) {
                    ctrl.cesiumDirective = {
                        config: {}
                    };
                }

                // create the viewer
                ctrl.cesium = new Cesium.Viewer($element[0], ctrl.cesiumDirective.config);

                // this makes sure our parent app gets its cesiumInstance back
                ctrl.cesiumDirective.cesiumInstance = new cesiumFactory(ctrl.cesium);

                $timeout(function () {
                    ctrl.cesium.canvas.setAttribute('height', ctrl.cesium._lastHeight.toString());
                });
            },
            // define the "link" function
            link: function (scope, element, attr, ctrl) {
            }
        };
    }])

    // define the cesium factory
    .factory('cesiumFactory', [function () {
        // constructor
        function cesiumFactory(viewer) {
            this._viewer = viewer;
            this.pinBuilder = new Cesium.PinBuilder();
        }

        cesiumFactory.prototype = {
            createPin: function pinBuilder(options){
                if (angular.isUndefined(options.color)){
                    options.color = Cesium.Color.ROYALBLUE;
                }

                if (angular.isUndefined(options.size)){
                    options.size = 48;
                }

                return this.pinBuilder.fromColor(options.color, options.size).toDataURL();
            },
            addEntity: function addEntity(options) {
                return this._viewer.entities.add(options);
            },
            removeEntity: function removeEntity(id) {
                this._viewer.entities.removeById(id);
            },
            setCallbackProperty: function (property) {
                return new Cesium.CallbackProperty(function () {
                    return property;
                }, false);
            },
            getEventHandler: function () {
                return new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
            },
            /**
             * @name areInsidePolygon
             * @param entities
             * @param polygon
             * @param callback - (optional) to be sent to the  isInsidePolygon function
             * @returns {*}
             * @description runs over an entity collection and checks if the entity's position is inside a given polygon
             */
            areInsidePolygon: function areInsidePolygon(entities, polygon, callback) {

                // TODO::make sure entities is an entityCollection and polygon is a polygon graphics object
                if (angular.isUndefined(polygon)) {
                    return;
                }

                // if entities is empty, just use our viewer's entities
                if (entities === ''){
                    entities = this._viewer.entities;
                }

                return _.filter(entities.values, function (entity) {
                    return this.isInsidePolygon(entity, polygon, callback);
                })

            },
            /**
             * @name isInsidePolygon
             * @param entity
             * @param polygon
             * @param callback - (optional) a function to enact on every entity
             * @returns {boolean}
             * @description checks if an entity's position is inside a polygon
             */
            isInsidePolygon: function isInsidePolygon(entity, polygon) {

                if (!entity.position) return true;

                // get the Cartographic values of the cartesian position
                var cartographics = cartesian3ToCoordinates(entity.position);

                // get the cartesian position on height 0
                var entityPosition = new Cesium.Cartesian3.fromDegrees(cartographics.longitude, cartographics.latitude, 0.0);

                // get the polygon position
                var polygonPositions = _.clone(polygon.hierarchy.getValue());

                // add the first one to the end of the list, since it's the closing one
                polygonPositions.push(polygonPositions[0]);

                // counts how many times the ray crosses the polygon
                var crossCount = {
                    before: 0,
                    after: 0
                };

                // now go over the polygon positions
                for (var i = 0; i < polygonPositions.length - 1; i++) {
                    // get the i+1 point
                    var value1 = {x: polygonPositions[i + 1].x, y: polygonPositions[i + 1].y};

                    // get the i point
                    var value2 = {x: polygonPositions[i].x, y: polygonPositions[i].y};

                    // get min and max x values of the line
                    var xArray = [value2.x, value1.x].sort();

                    // get the slope of the line
                    var a = (value1.y - value2.y) / (value1.x - value2.x);

                    // get the constant of the line
                    var b = value2.y - a * value2.x;

                    // get x position in the entity's Y value
                    var pointX = (entityPosition.y - b) / a;


                    if (pointX > xArray[0] && pointX < xArray[1]) {
                        // if pointX is inside the line, count up
                        if (pointX < entityPosition.x) {
                            // if pointX is before our point
                            crossCount.before++;
                        } else {
                            // if pointX is after our point
                            crossCount.after++;
                        }
                    }
                }
                // we are inside the polygon if the number of crosses on both sides is odd
                var isInside = Boolean((crossCount.before % 2) && (crossCount.after % 2));
                if (angular.isDefined(callback) && angular.isFunction(callback)){
                    callback(entity, isInside);
                }
                return isInside;
            },
            /**
             * @name cartesian3ToCoordinates
             * @param cartesian
             * @returns {{cartographic}}
             * @description receives a cartesian coordinates and converts to longitude and latitude (degrees)
             */
            cartesian3ToCoordinates: function cartesian3ToCoordinates(cartesian) {
                var that = this;
                var ellipsoid = that._viewer.scene.globe.ellipsoid;
                var results = {};
                if (cartesian) {
                    var cartographic = ellipsoid.cartesianToCartographic(cartesian);
                    results.longitude = Cesium.Math.toDegrees(cartographic.longitude);
                    results.latitude = Cesium.Math.toDegrees(cartographic.latitude);
                } else {
                    results.latitude = results.longitude = '';
                }
                return results;
            }
        };

        return cesiumFactory;
    }]);