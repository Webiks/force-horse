"use strict";

//===============================================================//
// define the ngEchoButtons module (dependant on ngEcho)
angular.module('ngEchoButtons', ['ngEcho'])

    // add templates into cache
    .run(function ($templateCache) {
        // cache our buttons template
        $templateCache.put('ngEcho/echoButtons',
            '<div class="echoButtonsWrapper">\
              <md-button class="md-raised" ng-click="echoButtonsCtrl.echoButtonsInstance.ngEchoInstance.hello(\'Echo\')">Select All</md-button>\
              <md-button class="md-raised" ng-click="echoButtonsCtrl.echoButtonsInstance.ngEchoInstance.restoreInitialLinks()">Select Current Configuration</md-button>\
            </div>');
        //$templateCache.put('ngEcho/echoButtons',
        //    '<div class="echoButtonsWrapper">\
        //      <button ng-click="echoButtonsCtrl.echoButtonsInstance.ngEchoInstance.hello(\'Echo\')">Select All</button>\
        //      <button ng-click="echoButtonsCtrl.echoButtonsInstance.ngEchoInstance.restoreInitialLinks()">Select Current Configuration</button>\
        //    </div>');
    })

    .directive('echoButtons', function (echoButtonsFactory, $compile) {
        return {
            restrict: 'A',
            priority: -200,
            require: 'echoDirective',
            link: function (scope, element, attr, ctrl) {
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);

                // add parent's controller to the scope
                isoScope.echoButtonsCtrl = ctrl;

                // create a echoButtonsInstance and add it to our controller
                isoScope.echoButtonsCtrl.echoButtonsInstance = new echoButtonsFactory(ctrl.echoDirective.echoInstance);

                // get the template using our API
                var template = isoScope.echoButtonsCtrl.echoButtonsInstance.getTemplate();

                // turn the template into an angular element
                template = angular.element(template);

                // compile the template
                template = $compile(template)(isoScope);

                // inject into the DOM above the echo viewer
                element.prepend(template);
            }
        };
    })
    .factory('echoButtonsFactory', function ($templateCache) {
        // constructor
        function echoButtonsFactory(_ngEchoInstance) {
            this.ngEchoInstance = _ngEchoInstance;
            _ngEchoInstance.echoButtons = this;
        }

        echoButtonsFactory.prototype.getTemplate = function () {
            return $templateCache.get('ngEcho/echoButtons');

        };

        return echoButtonsFactory;
    });
//===============================================================//
