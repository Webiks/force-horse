"use strict";

//===============================================================//
// define the ngEchoForm module (dependant on ngEcho)
angular.module('ngEchoForm', ['ngEcho'])
    // add templates into cache
    .run(function($templateCache){
        // cache our buttons template
        $templateCache.put('ngEcho/echoForm',
            '<div class="echoFormWrapper">\
            <label for="noOfAsdMsgs" class="margin-left">Number of asd messages</label>\
            <input type="number" id="noOfAsdMsgs" min="0" max="30" ng-model="echoFormCtrl.echoFormInstance.ngEchoInstance.formValues.selectedValue">\
            <input type="checkbox" id="displayStatistics" class="margin-left" ng-model="echoFormCtrl.echoFormInstance.ngEchoInstance.formValues.checkBox1"\
            ng-true-value="1" ng-false-value="0">\
            <label for="displayStatistics">Display statistics</label>\
            <input type="checkbox" id="displayWorstCase" class="margin-left" ng-model="echoFormCtrl.echoFormInstance.ngEchoInstance.formValues.checkBox2"\
            ng-true-value="1" ng-false-value="0">\
            <label for="displayWorstCase">Display worst case</label>\
            <md-button class="md-raised" ng-click="echoFormCtrl.echoFormInstance.ngEchoInstance.send()" class="margin-left">Test asd</button>\
            </div>')
    })
    .directive('echoForm', function(echoFormFactory, $compile){
        return {
            restrict: 'A',
            priority: -100,
            require: 'echoDirective',
            link: function(scope, element, attr, ctrl){
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);

                // add parent's controller to the scope
                isoScope.echoFormCtrl = ctrl;

                // create a echoFormInstance and add it to our controller
                isoScope.echoFormCtrl.echoFormInstance = new echoFormFactory(ctrl.echoDirective.echoInstance);

                // get the template using our API
                var template = isoScope.echoFormCtrl.echoFormInstance.getTemplate();

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
    .factory('echoFormFactory', function($templateCache){
        // constructor
        function echoFormFactory(ngEchoInstance){
            this.ngEchoInstance = ngEchoInstance;
            ngEchoInstance.echoForm = this;
        }

        echoFormFactory.prototype = {
            getTemplate: function(){
                return $templateCache.get('ngEcho/echoForm');
            }
        };

        return echoFormFactory;
    });
//===============================================================//
