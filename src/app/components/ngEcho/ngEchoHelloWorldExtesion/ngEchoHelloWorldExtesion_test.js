'use strict';
describe('ngEcho Hellow World Extension module tests', function() {

    // options holds the name of the module to load
    var options = {
        extensionName: 'ngEchoHelloWorldExtension'
    };

    // runs shared beforeEach command (load module, load directive etc.)
    ngEchoExtensionTest(options);

    // tests for the directive
    describe('ngEchoHelloWorldExtension directive tests', function() {

    });

    // tests for the factory
    describe('ngEchoHelloWorldExtension factory tests', function() {
        it('echoHelloWorldExtension should be in the echo instance', function(){
            expect(options.isoScope.echoCtrl.echoDirective.echoInstance.echoHelloWorldExtension).toBeDefined();
        });

    });

    // you can add as many tests as you like here
});