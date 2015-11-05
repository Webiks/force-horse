"use strict";

//===============================================================//
// define the ngEchoForm module (dependant on ngEcho)
angular.module('ngEchoHeader', ['ngEcho'])
    // add templates into cache
    .run(function($templateCache){
        // cache our buttons template
        $templateCache.put('ngEcho/echoHeader',
            '<md-toolbar layout="row" layout-align="center center" class="echoHeaderWrapper">\
              <svg viewBox="0 0 100 100">\
                <circle r="33" cx="50" cy="50"/>\
                <line x1="40" y1="40" x2="60" y2="60"/>\
                <line x1="40" y1="60" x2="60" y2="40"/>\
              </svg> \
              <span flex class="title">asd Test</span>\
            </md-toolbar>');
        //$templateCache.put('ngEcho/echoHeader',
        //    '<div class="echoHeaderWrapper">\
        //      <span class="exit">x</span>\
        //      <span class="title">asd Test</span>\
        //    </div>')
    })
    .directive('echoHeader', function(echoHeaderFactory, $compile){
        return {
            restrict: 'A',
            priority: -50,
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
