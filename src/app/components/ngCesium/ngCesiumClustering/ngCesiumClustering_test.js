'use strict';

describe('ngCesium module', function() {

    var $compile, $rootScope;
    beforeEach(module('ngCesiumAddRemoveButtons'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    describe('ngCesiumAddRemoveButtons directive', function() {
        var element;
        beforeEach(inject(function() {
            element = $compile('<div cesium-directive="cesiumConfig" cesium-add-remove-buttons-directive></div>')($rootScope);
        }));

        it('should instantiate add buttons to the view', function() {
            var buttonsWrapper = element.find('.cesiumButton');
            expect(angular.element(element.children()).hasClass('cesium-viewer')).toEqual(true);
        });

        it('clicking the add button should call addButtonCall function', function() {


            var cesiumInstance = element.scope().$$childHead.cesiumCtrl.cesiumDirective.cesiumInstance;
            spyOn(cesiumInstance._addRemoveButtons, 'addButtonCall');

            element.
            uiGridColumnsFiltersService.filter(gridScope.grid.columns[0]);

            expect(gridScope.grid.api.core.notifyDataChange).toHaveBeenCalledWith(uiGridConstants.dataChange.COLUMN);
            expect(angular.element(element.children()).hasClass('cesium-viewer')).toEqual(true);
        });

        it('clicking the remove button should call removeButtonCall function', function() {
            expect(angular.element(element.children()).hasClass('cesium-viewer')).toEqual(true);
        });

    });

    describe('ngCesiumAddRemoveButtons factory', function() {

    });
});