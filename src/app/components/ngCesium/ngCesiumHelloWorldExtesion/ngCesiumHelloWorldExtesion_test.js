'use strict';
describe('ngCesium Hellow World Extension module tests', function() {

    // options holds the name of the module to load
    var options = {
        extensionName: 'ngCesiumHelloWorldExtension'
    };

    // runs shared beforeEach command (load module, load directive etc.)
    ngCesiumExtensionTest(options);

    // tests for the directive
    describe('ngCesiumHelloWorldExtension directive tests', function() {

    });

    // tests for the factory
    describe('ngCesiumHelloWorldExtension factory tests', function() {
        it('cesiumHelloWorldExtension should be in the cesium instance', function(){
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumHelloWorldExtension).toBeDefined();
        });

    });

    // you can add as many tests as you like here
});