'use strict';

describe('ngEcho module', function () {

    var $compile, $rootScope, element;

    beforeEach(module('ngEcho'));

    function setEchoInDom() {
        beforeEach(inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $rootScope.echoConfig = {};
            $rootScope.echoConfig.config = {};

            element = $compile(angular.element('<div echo-directive="echoConfig"></div>'))($rootScope);
        }));

        afterEach(function () {
            element.remove();
        });
    }

    function getEchoInstance(element) {
        var isoScope = element.scope().$$childHead;
        return isoScope.echoCtrl.echoDirective.echoInstance;
    }

    describe('ngEcho directive', function () {
        setEchoInDom();

        it('should create an echo factory instance', function () {
            expect(getEchoInstance(element)).toBeDefined();
        });
    });

    describe('echoFactory', function () {
        var echoFactory, echoInstance;

        beforeEach(inject(function (_echoFactory_) {
            echoFactory = _echoFactory_;
        }));

        afterEach(function () {
            echoInstance = null;
        });

        describe('echoFactory constructor', function () {

            it('should set _configError to a boolean value', function () {
                echoInstance = new echoFactory();
                expect(typeof echoInstance._configError).toEqual("boolean");
            });

            it('should assign the first parameter to _container', function () {
                echoInstance = new echoFactory({1: 17});
                expect(echoInstance._container).toEqual({1: 17});
            });

            it('should set _configError to true, if _container is not an object', function () {
                echoInstance = new echoFactory(17);
                expect(echoInstance._configError).toEqual(true);
            });

            it('should assign the second parameter to _options', function () {
                echoInstance = new echoFactory(undefined, {1: 18});
                expect(echoInstance._options).toEqual({1: 18});
            });

            it('should set _configError to true, if _options is not an object', function () {
                echoInstance = new echoFactory({}, 17);
                expect(echoInstance._configError).toEqual(true);
            });

            it('should assign the "form" property of _options to _formOptions', function () {
                echoInstance = new echoFactory(undefined, {form: 3});
                expect(echoInstance._formOptions).toBeDefined();
                expect(echoInstance._formOptions).toEqual(3);
            });

            it('should assign the "generalConfig" property of _options to _generalConfig', function () {
                echoInstance = new echoFactory(undefined, {generalConfig: 5});
                expect(echoInstance._generalConfig).toBeDefined();
                expect(echoInstance._generalConfig).toEqual(5);
            });

            it('should assign the "configuration" property of _options to _config', function () {
                echoInstance = new echoFactory(undefined, {configuration: {1: 19}});
                expect(echoInstance._config).toBeDefined();
                expect(echoInstance._config).toEqual({1: 19});
            });

            it('setConfig should assign the first parameter to _config', function () {
                echoInstance = new echoFactory();
                var testConfig = {i: 3};
                echoInstance.setConfig(testConfig);
                expect(echoInstance._config).toBe(testConfig);
            });

            it('setGeneralConfig should assign lvlAImg to the image at url lvlAImage', function() {
                echoInstance = new echoFactory();
                var testGeneralConfig = {lvlAImage:'http://www.freeimages.com/assets/182924/1829230933/leaf-collection-1-895724-m.jpg'};
                echoInstance.setGeneralConfig(testGeneralConfig);
                expect(echoInstance._generalConfig.lvlAImg).toBeDefined();
                expect(echoInstance._generalConfig.lvlAImg instanceof HTMLImageElement).toEqual(true);
                expect(echoInstance._generalConfig.lvlAImg.src).toEqual(echoInstance._generalConfig.lvlAImage);
            });
        });

/*
        describe('echoFactory methods', function () {
            var testElement = angular.element('<div></div>');
            var testOptions;

            beforeEach(function () {
                echoInstance = new echoFactory(
                    testElement[0],
                    testOptions
                );
            });

        });
*/
    });

//====================================================================//

    describe('ngEcho service', function () {
        var echoService;
        beforeEach(inject(function (_echoService_) {
            echoService = _echoService_;
        }));
        describe('something..', function () {

            setEchoInDom();

            it('should get somewhere..', function () {
                var echoInstance = getEchoInstance(element);

            });
        })
    });
});