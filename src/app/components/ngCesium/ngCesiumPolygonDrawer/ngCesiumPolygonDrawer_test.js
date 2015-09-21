'use strict';

describe('ngCesium PolygonDrawer module tests', function() {

    var $compile, $rootScope, element;
    beforeEach(module('ngCesiumPolygonDrawer'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $rootScope.cesiumConfig = {
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
        element = $compile('<div cesium-directive="cesiumConfig" cesium-polygon-drawer></div>')($rootScope);
    }));

    describe('ngCesiumPolygonDrawer directive tests', function() {



    });

    describe('ngCesiumPolygonDrawer factory tests', function() {
        it('ngCesiumPolygonDrawer should be in the cesium instance', function(){
            var isoScope = element.scope().$$childHead;
            expect(isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumPolygonDrawer).toBeDefined();
        });

    });
});