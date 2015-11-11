'use strict';

xdescribe('autoForceLayout Add Remove Buttons module tests', function() {

    var $compile, $rootScope;
    beforeEach(module('ngEchoButtons'));

    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    describe('ngEchoButtons directive', function() {
        var element;
        beforeEach(inject(function() {
            element = $compile('<div echo-directive="echoConfig" echo-add-remove-buttons-directive></div>')($rootScope);
            var buttonsWrapper = element.find('.echoButton');
            var addButton = element.find('.ngEchoAddButton');
            var addButton = element.find('.ngEchoRemoveButton');
        }));

        it('should instantiate add buttons to the view', function() {

            expect(angular.element(element.children()).hasClass('echo-viewer')).toEqual(true);
        });

        it('clicking the add button should call addButtonCall function', function() {


            var echoInstance = element.scope().$$childHead.echoCtrl.echoDirective.echoInstance;
            spyOn(echoInstance._addRemoveButtons, 'addButtonCall');


            //expect(gridScope.grid.api.core.notifyDataChange).toHaveBeenCalled(uiGridConstants.dataChange.COLUMN);
        });

        it('clicking the remove button should call removeButtonCall function', function() {
            //expect(angular.element(element.children()).hasClass('echo-viewer')).toEqual(true);
        });

    });

    describe('ngEchoButtons factory', function() {

    });
});