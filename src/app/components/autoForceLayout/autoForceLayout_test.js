'use strict';

describe('autoForceLayout module', function () {

    var $compile, $rootScope, constants, parentScope, element;

    beforeEach(module('autoForceLayout'));
    function _mock(){
        module(function($provide) {
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
            parentScope.aflOptions = {data: [
                {id: constants.NODES_ID, data: [
                    {id:1, label:'first'},
                    {id:3, label:'second'}
                ]},
                {id: constants.EDGES_ID, data: [
                    {sourceID:1, targetID:3}
                ]}
            ]};
            element = $compile(angular.element('<div auto-force-layout options="aflOptions"></div>'))(parentScope);
        });
    }

    beforeEach(function(){
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
        var myInstance;

        beforeEach( function () {
            myInstance = getInstance(element);
        });

        describe('initLayout()', function () {
            it ('Should assign a non-empty string to property instanceName', function () {
                expect(myInstance.instanceName).toBeDefined();
                expect(typeof myInstance.instanceName).toBe('string');
                expect(instanceName).not.toBe("");
            });
        });

    });
});