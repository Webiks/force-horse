'use strict';

describe('forceHorse module', function () {

    var $compile, $rootScope, constants, parentScope, element;

    beforeEach(module('forceHorse'));

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
        inject(function (_$compile_, _$rootScope_, ForceHorseConstants) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            constants = ForceHorseConstants;
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
            element = $compile(angular.element('<div force-horse options="aflOptions"></div>'))(parentScope);
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
        return isoScope.forceHorseCtrl.options.forceHorseInstance;
    }

    describe('forceHorse directive', function () {
        it('should create an forceHorse instance', function () {
            expect(getInstance(element)).toBeDefined();
        });
    });

    describe('forceHorse factory', function () {
        var aflInstance, options, ForceHorseFactory, aflPrototype;

        function _getInstance() {
            inject(function (_ForceHorseFactory_) {
                ForceHorseFactory = _ForceHorseFactory_;
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
                aflInstance = new ForceHorseFactory(element, options);
                aflPrototype = Object.getPrototypeOf(aflInstance);
            });
        }

        beforeEach(function () {
            _getInstance();
        });

        afterEach(function () {
            element.remove();
        });

        describe('initLayout()', function () {

            function _callInitLayout(...arg){
                aflInstance.initLayout(...arg);
            }

            describe('', function() {
                beforeEach(function () {
                    _callInitLayout({});
                });

                it('Should assign the property instanceName', function () {
                    expect(typeof aflInstance.instanceName).toBeDefined();
                });

                it('Should assign properties nodeDataArray and edgeDataArray', function () {
                    expect(aflInstance.nodeDataArray).toBe(options.data[0].data);
                    expect(aflInstance.edgeDataArray).toBe(options.data[1].data);
                });

            });

            describe('', function() {
                it('Should call method processNodes', function () {
                    spyOn(aflPrototype, 'processNodes').and.callThrough();
                    _callInitLayout({});
                    expect(aflPrototype.processNodes).toHaveBeenCalled();
                });
            });
        });

    });
});