'use strict';

describe('autoForceLayout module', function () {

    var $compile, $rootScope, constants, parentScope, element;

    beforeEach(module('autoForceLayout'));

    function _mock() {
        module(function ($provide) {
            //$provide.service('$mdDialog', function() {
            //    this.show = function(){
            //        return {
            //            then: function(){
            //
            //            }
            //        }
            //    }
            //});
        });
    }

    function _setInDom() {
        inject(function (_$compile_, _$rootScope_, AutoForceLayoutConstants) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            constants = AutoForceLayoutConstants;
            parentScope = $rootScope.$new();
            parentScope.aflOptions = {
                data: [
                    {
                        id: constants.NODES_ID, data: [
                        {id: 1, label: 'first'},
                        {id: 3, label: 'second'}
                    ]
                    },
                    {
                        id: constants.EDGES_ID, data: [
                        {sourceID: 1, targetID: 3}
                    ]
                    }
                ]
            };
            element = $compile(angular.element('<div auto-force-layout options="aflOptions"></div>'))(parentScope);
        });
    }

    beforeEach(function () {
        _mock();
        _setInDom();
    });

    afterEach(function () {
        element.remove();
    });

    function getInstance(element) {
        var isoScope = element.scope().$$childHead;
        return isoScope.autoForceLayoutCtrl.options.autoForceLayoutInstance;
    }

    describe('autoForceLayout directive', function () {
        it('should create an autoForceLayout instance', function () {
            expect(getInstance(element)).toBeDefined();
        });
    });

    describe('autoForceLayout factory', function () {
        var myInstance, options, AutoForceLayoutFactory, proto;

        function _getInstance() {
            inject(function (_AutoForceLayoutFactory_) {
                AutoForceLayoutFactory = _AutoForceLayoutFactory_;
                options = {
                    data: [
                        {
                            id: 1, data: [
                            {id: 1, label: 'first'},
                            {id: 3, label: 'second'}
                        ]
                        },
                        {
                            id: 2, data: [
                            {sourceID: 1, targetID: 3}
                        ]
                        }
                    ]
                };
                element = angular.element('<div></div>');
                myInstance = new AutoForceLayoutFactory(element, options);
                proto = Object.getPrototypeOf(myInstance);
            });
        }

        beforeEach(function () {
            _getInstance();
        });

        afterEach(function () {
            element.remove();
        });

        describe('initLayout()', function () {
            beforeEach(function () {
                myInstance.initLayout({});
            });

            it('Should assign a non-empty string to property instanceName', function () {
                expect(typeof myInstance.instanceName).toBe('string');
                expect(myInstance.instanceName).not.toBe("");
            });

            it('Should assign properties nodeDataArray and edgeDataArray', function () {
                expect(myInstance.nodeDataArray).toBe(options.data[0].data);
                expect(myInstance.edgeDataArray).toBe(options.data[1].data);
            });

            it ('Should call method processNodes', function () {
                //spyOn(myInstance, 'processNodes');
                spyOn(proto, 'processNodes');
                expect(proto.processNodes).toHaveBeenCalled();
            })
        });

    });
});