"use strict";

//===============================================================//
// define the ngEchoHeader module (dependant on ngEcho)
angular.module('ngEchoHeader', ['ngEcho'])
    // add templates into cache
    .run(function($templateCache){
        // cache our buttons template
        $templateCache.put('ngEcho/echoHeader',
            '<div class="echoHeaderWrapper">\
            <label for="noOfAsdMsgs" class="margin-left">Number of asd messages</label>\
            <input type="number" id="noOfAsdMsgs" min="0" max="30" ng-model="echoHeaderCtrl.echoHeaderInstance.ngEchoInstance.formValues.selectedValue">\
            <input type="checkbox" id="displayStatistics" class="margin-left" ng-model="echoHeaderCtrl.echoHeaderInstance.ngEchoInstance.formValues.checkBox1"\
            ng-true-value="1" ng-false-value="0">\
            <label for="displayStatistics">Display statistics</label>\
            <input type="checkbox" id="displayWorstCase" class="margin-left" ng-model="echoHeaderCtrl.echoHeaderInstance.ngEchoInstance.formValues.checkBox2"\
            ng-true-value="1" ng-false-value="0">\
            <label for="displayWorstCase">Display worst case</label>\
            <button ng-click="echoHeaderCtrl.echoHeaderInstance.ngEchoInstance.send()" class="margin-left">Test asd</button>\
            </div>')
    })
    .directive('echoHeader', function(echoHeaderFactory, $compile){
        return {
            restrict: 'A',
            priority: -100,
            require: 'echoDirective',
            link: function(scope, element, attr, ctrl){
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);

                // add parent's controller to the scope
                isoScope.echoHeaderCtrl = ctrl;

                // create a echoHeaderInstance and add it to our controller
                isoScope.echoHeaderCtrl.echoHeaderInstance = new echoHeaderFactory(ctrl.echoDirective.echoInstance);

                // get the template using our API
                var template = isoScope.echoHeaderCtrl.echoHeaderInstance.getTemplate();

                // turn the template into an angular element
                template = angular.element(template);

                // compile the template
                template = $compile(template)(isoScope);

                // inject into the DOM above the echo viewer
                element.prepend(template);
                //element.parent().prepend(template);
            }
        };
    })
    .factory('echoHeaderFactory', function($templateCache){
        // constructor
        function echoHeaderFactory(ngEchoInstance){
            this.ngEchoInstance = ngEchoInstance;
            ngEchoInstance.echoHeader = this;
        }

        echoHeaderFactory.prototype = {
            getTemplate: function(){
                return $templateCache.get('ngEcho/echoHeader');
            }
        };

        return echoHeaderFactory;
    });
//===============================================================//
