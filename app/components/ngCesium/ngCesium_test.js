'use strict';

describe('ngCesium module', function() {

    var $compile, $rootScope;
    beforeEach(module('ngCesium'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    describe('ngCesium directive', function() {
        var element;
        beforeEach(inject(function() {
            element = $compile('<div cesium-directive="cesiumConfig"></div>')($rootScope);
        }));
        it('should instantiate a cesium viewer', function() {
            expect(angular.element(element.children()).hasClass('cesium-viewer')).toEqual(true);
        });

        it('should create a cesium service instance', function() {
            var isoScope = element.scope().$$childHead;
            expect(isoScope.cesiumCtrl.cesiumDirective.cesiumInstance).toBeDefined();
        });

    });

    describe('ngCesium factory', function() {
        var cesiumService, cesiumInstance;
        var element = angular.element('<div></div>');
        beforeEach(inject(function(_cesiumService_) {
            cesiumService = _cesiumService_;
            cesiumInstance = new cesiumService(new Cesium.Viewer(element[0], {
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
    });
});