'use strict';

describe('ngCesium PolygonDrawer module tests', function() {

    var options = {
        extensionName: 'ngCesiumPolygonDrawer'
    };

    ngCesiumExtensionTest(options);
    
    describe('ngCesiumPolygonDrawer directive tests', function() {

    });

    describe('ngCesiumPolygonDrawer factory tests', function() {
        it('ngCesiumPolygonDrawer should be in the cesium instance', function(){
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumPolygonDrawer).toBeDefined();
        });

        it('Should define eventsHandler, the polygon entity and the current state', function(){
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumPolygonDrawer.eventsHandler).toBeDefined();
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumPolygonDrawer.polygonEntity).toBeDefined();
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumPolygonDrawer.currentlyDrawing).toBe(false);
        });

        describe('ngcesiumPolygonDrawer.startDrawing tests', function() {
            var result;

            beforeEach(function(){
                result = options.extensionInstance.startDrawing();
            });

            it('Should set event handler for move', function(){
                var callback = options.extensionInstance.eventsHandler.getInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                expect(callback.name).toBe('updatePolyline');
            });

            it('Should set event handler for click', function(){
                var callback = options.extensionInstance.eventsHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                expect(callback.name).toBe('addPolylinePoint');
            });

            it('Should set event handler for double click', function(){
                var callback = options.extensionInstance.eventsHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
                expect(callback.name).toBe('closePolygon');
            });

            it('Should return a promise', function(){
                expect(result.then).toBeDefined();
            });
        });

        describe('ngoptions.extensionInstance..stopDrawing tests', function() {
        });



    });
});