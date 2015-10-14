'use strict';

// define the ngEcho module
angular.module('ngEcho', [])
    //define the echo directive
    .directive('echoDirective', ['$timeout', 'echoFactory', function ($timeout, echoFactory) {
        // return the directive definition object
        return {
            priority: 500,
            restrict: "EA",
            controllerAs: "echoCtrl",
            scope: {
                echoDirective: "="
            },
            bindToController: true,
            controller: function ($scope, $element) {
                var ctrl = this;

                // handle the case in which no config is sent
                if (angular.isUndefined(ctrl.echoDirective)) {
                    ctrl.echoDirective = {};
                }

                if (angular.isUndefined(ctrl.echoDirective.configuration)) {
                    ctrl.echoDirective.configuration = {};
                }

                // this makes sure our parent app gets its echoInstance back
                ctrl.echoDirective.echoInstance = new echoFactory($element[0], ctrl.echoDirective);

                $timeout(function () {
                    //ctrl.echo.canvas.setAttribute('height', ctrl.echo._lastHeight.toString());
                });
            },
            // define the "link" function
            link: function (scope, element, attr, ctrl) {
            }
        };
    }])

    // define the echo factory
    .factory('echoFactory', [function () {
        //
        // Constructor
        //
        function echoFactory(container, options) {
            this.setConfigError(false);
            this.setContainer(container);
            this.setOptions(options);
        }

        echoFactory.prototype = {

            setConfigError: function setConfigError(value, message){
                this._configError = value;
                if (this._configError) {
                    this._configErrorMessage = message;
                    console.error("Echo configuration error: " + message);
                }
            },

            setContainer: function setContainer(container) {
                this._container = container;
                if (typeof container !== "object") {
                    this.setConfigError(true, "Container is not an object");
                }
            },

            setOptions: function setOptions(options) {
                this._options = options;
                if (typeof options !== "object") {
                    this.setConfigError(true, "Options is not an object");
                } else {
                    this._formOptions = options.form;
                    this.setGeneralConfig(options.generalConfig);
                    this.setConfig(options.configuration);
                }
            },

            setGeneralConfig: function setGeneralConfig(genConfig) {
                this._generalConfig = genConfig;
            },

            setConfig: function setConfig(config) {
                this._config = config;
            }
        };

        return echoFactory;
    }])

.service('echoService', [function(){
        return {

        }
    }]);