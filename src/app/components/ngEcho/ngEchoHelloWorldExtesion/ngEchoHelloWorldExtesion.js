// ngEchoHelloWorldExtension - an ngEcho extension example
/**
 * @ naming conventions:
 * module name: starts with ngEcho, camelcase
 * directive name: as the name of the extension module, without the ng, camelcase
 * factory name: as the name of the directive, with Factory in the end, camelcase
 */
angular.module('ngEchoHelloWorldExtension', ['ngEcho'])
    .directive('echoHelloWorldExtension', function(echoHelloWorldExtensionFactory){
        return {
            restrict: 'A',
            require: 'echoDirective',
            link: function(scope, element, attr, ctrl){
                // create the extension's instance and add it to our echo instance controller for reference
                ctrl.echoHelloWorldExtension = new echoHelloWorldExtensionFactory(ctrl.echoDirective.echoInstance);
            }
        };
    })
    .factory('echoHelloWorldExtensionFactory', function($q){
        // constructor
        function echoHelloWorldExtensionFactory(ngEchoInstance){
            var that = this;
            // cross reference to the instances
            that.ngEchoInstance = ngEchoInstance;
            ngEchoInstance.echoHelloWorldExtension = that;
        }

        // extension business logic comes here
        echoHelloWorldExtensionFactory.prototype = {

        };

        // return the constructor
        return echoHelloWorldExtensionFactory;
    });