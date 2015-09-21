'use strict';

describe('ngCesium module', function() {

    var $compile, $rootScope, element;
    beforeEach(module('ngCesium'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $rootScope.cesiumConfig = {};
        $rootScope.cesiumConfig.config = {
            baseLayerPicker: false,
            fullscreenButton: false,
            homeButton: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            animation: false,
            geocoder: false
        };

        element = $compile(angular.element('<div cesium-directive="cesiumConfig"></div>'))($rootScope);
    }));

    describe('ngCesium directive', function() {

        it('should instantiate a cesium viewer', function() {
            expect(angular.element(element.children()).hasClass('cesium-viewer')).toEqual(true);
        });

        it('should create a cesium service instance', function() {
            var isoScope = element.scope().$$childHead;
            expect(isoScope.cesiumCtrl.cesiumDirective.cesiumInstance).toBeDefined();
        });
    });

    describe('ngCesium factory', function() {
        var cesiumFactory, cesiumInstance;
        var element = angular.element('<div></div>');
        beforeEach(inject(function(_cesiumFactory_) {
            cesiumFactory = _cesiumFactory_;
            cesiumInstance = new cesiumFactory(new Cesium.Viewer(element[0], {
                baseLayerPicker: false,
                fullscreenButton: false,
                homeButton: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                animation: false,
                geocoder: false
            }));
        }));

        it('should be instantiated with a cesium viewer', function() {
            expect(cesiumInstance._viewer).toBeDefined();
        });

        it('cesiumInstance.addEntity should add a new entity', function() {
            cesiumInstance.addEntity({
                id: 'my_id',
                label: {
                    text: 'my_text'
                }
            });
            expect(cesiumInstance._viewer.entities.values.length).toEqual(1);
        });

        it('cesiumInstance.addEntity should add a new entity', function() {
            cesiumInstance.addEntity({
                id: 'my_id',
                label: {
                    text: 'my_text'
                }
            });

            cesiumInstance.removeEntity('my_id');
            expect(cesiumInstance._viewer.entities.values.length).toEqual(0);
        });

        it('cesiumInstance.setCallbackProperty should return a callback property that resolves to the property sent', function() {
            var property = 'my property';
            expect(cesiumInstance.setCallbackProperty(property).getValue()).toEqual(property);
        });

        describe('cesiumInstance.cartesian3ToCoordinates tests', function(){
            it('Should return undefined if called without parameters', function() {
                expect(cesiumInstance.cartesian3ToCoordinates()).toBeUndefined();
            });

            it('Should return object with longitude and latitude', function() {
                var cartesian3 = cesiumInstance.toCartesian3(20, 25);
                var result = cesiumInstance.cartesian3ToCoordinates(cartesian3);
                expect({long: Number(result.longitude.toFixed(2)), lat: Number(result.latitude.toFixed(2))}).toEqual({long: 20.00, lat: 25.00});
            });

        });

        describe('cesiumInstance.tocartesian3 tests', function(){
            it('Should return false when called without parameters', function() {
                expect(cesiumInstance.toCartesian3()).toBe(false);
            });

            it('Should return false when called with one parameter that is not an array', function() {
                expect(cesiumInstance.toCartesian3(18)).toBe(false);
            });

            it('Should return false when called with an array with an odd number of elements', function() {
                expect(cesiumInstance.toCartesian3([18, 19, 20])).toBe(false);
                expect(cesiumInstance.toCartesian3([18])).toBe(false);
            });

            it('Should return false when called with an array and a boolean, and the array is not a mult of 3', function() {
                expect(cesiumInstance.toCartesian3([18, 19, 20, 22], true)).toBe(false);
            });

            it('Should call Cesium.Cartesean3.fromDegrees when called with 2 numbers', function() {
                expect(cesiumInstance.toCartesian3(18, 19)).toEqual(Cesium.Cartesian3.fromDegrees(18,19));
            });

            it('Should call Cesium.Cartesean3.fromDegrees when called with 3 numbers', function() {
                expect(cesiumInstance.toCartesian3(18, 19, 50)).toEqual(Cesium.Cartesian3.fromDegrees(18,19, 50));
            });

            it('Should call Cesium.Cartesean3.fromDegrees when called with an array', function() {
                var input = [18, 19, 50, 30];
                spyOn(Cesium.Cartesian3, 'fromDegreesArray');
                cesiumInstance.toCartesian3(input);
                expect(Cesium.Cartesian3.fromDegreesArray).toHaveBeenCalledWith(input);
                expect(cesiumInstance.toCartesian3(input)).toEqual(Cesium.Cartesian3.fromDegreesArray(input));
            });

            it('Should call Cesium.Cartesean3.fromDegrees when called with an array with heights', function() {
                var input = [18, 19, 50, 27, 33, 130];
                spyOn(Cesium.Cartesian3, 'fromDegreesArrayHeights');
                cesiumInstance.toCartesian3(input, true);
                expect(Cesium.Cartesian3.fromDegreesArrayHeights).toHaveBeenCalledWith(input);
                expect(cesiumInstance.toCartesian3(input, true)).toEqual(Cesium.Cartesian3.fromDegreesArrayHeights(input));
            });
        });

        describe('cesiumInstance.isInsidePolygon tests', function(){
            it('cesiumInstance.isInsidePolygon return false when given an entity that is outside a given polygon', function() {
                var entity = cesiumInstance._viewer.entities.add({
                    position: cesiumInstance.toCartesian3(20, 20),
                    polygon: {
                        hierarchy: cesiumInstance.toCartesian3([30, 40, 50, 60, 40, 30])
                    }
                });

                var polygon = entity.polygon;
                expect(cesiumInstance.isInsidePolygon(entity, polygon)).toBe(false);
            });

            it('cesiumInstance.isInsidePolygon return false when given an entity that is outside a given polygon', function() {
                var entity = cesiumInstance._viewer.entities.add({
                    position: cesiumInstance.toCartesian3(20, 20),
                    polygon: {
                        hierarchy: cesiumInstance.toCartesian3([15, 15, 30, 15, 30, 30, 15, 30])
                    }
                });

                var polygon = entity.polygon;
                expect(cesiumInstance.isInsidePolygon(entity, polygon)).toBe(true);
            });

        });

        describe('cesiumInstance.areInsidePolygon tests', function(){
            it('Should return empty array if no polygon is sent', function(){
                expect(cesiumInstance.areInsidePolygon()).toEqual([]);
            });

            it('Should return 2 entities that are inside the polygon', function(){
                var entity = cesiumInstance._viewer.entities.add({
                    position: cesiumInstance.toCartesian3(20, 20),
                    polygon: {
                        hierarchy: cesiumInstance.toCartesian3([15, 15, 30, 15, 30, 30, 15, 30])
                    }
                });

                var polygon = entity.polygon;

                cesiumInstance._viewer.entities.add({
                    position: cesiumInstance.toCartesian3(19, 19),
                    polygon: {
                        hierarchy: cesiumInstance.toCartesian3([15, 15, 30, 15, 30, 30, 15, 30])
                    }
                });

                cesiumInstance._viewer.entities.add({
                    position: cesiumInstance.toCartesian3(50, 50),
                    polygon: {
                        hierarchy: cesiumInstance.toCartesian3([15, 15, 30, 15, 30, 30, 15, 30])
                    }
                });


                expect(cesiumInstance.areInsidePolygon('', polygon).length).toEqual(2);
            });
        })
    });
});