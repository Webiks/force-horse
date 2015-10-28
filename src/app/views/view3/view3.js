'use strict';

angular.module('myApp.view3', ['ui.router', 'ngEcho'])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('index.view3', {
            url: '/view3',
            templateUrl: 'app/views/view3/view3.html',
            controller: 'view3Ctrl as viewCtrl',
            data: {
                title: 'View 3'
            }
        });
    }])

    .controller('view3Ctrl', ['$scope', function ($scope) {
        console.log('In mainAppCtrl');
        var vm = this;

        vm.randomVal = function() {
            return Math.round(Math.random() * vm.echoOptions.generalConfig.treshold * 2);
        }

        vm.myCallback = function (formValues, paths) {
            console.log("myCallBack has been called, with params "
                + JSON.stringify(formValues) + " " + JSON.stringify(paths));
            // update paths with information
            var newPath, newPaths = [];
            paths.forEach(function (path) {
                newPath = {
                    segment: path,
                    average: {
                        roundTripTime: vm.randomVal(),
                        bitRate: vm.randomVal(),
                        count: vm.randomVal()
                    },
                    worst: {
                        roundTripTime: vm.randomVal(),
                        bitRate: vm.randomVal(),
                        count: vm.randomVal()
                    }
                };
                newPaths.push(newPath);
            });
// call directive API
            vm.echoOptions.echoInstance.setPaths(newPaths);
        }


        // config variable in the main controller context
        vm.echoOptions = {
            form: {
                defaults: {
                    selectedValue: 15,
                    checkBox1: 0,
                    checkBox2: 1
                },
                selectOptions: [{
                    label: '',
                    value: 15
                }],
                submitCallback: function (formValues, paths) {
                    vm.myCallback(formValues, paths);
                }
            },
// TODO::save the first configuration as the current configuration
// TODO::expose "setCurrentConfiguration" to replace currectConfiguration
// TODO::expose "setNodes" to replace presentation
            generalConfig: {
                lvlAImage: 'http://placeskull.com/30/50/c0c0e0/7',
                lvlBImage: 'http://placeskull.com/30/50/c0c0e0/21',
                lvlCImage: 'http://placeskull.com/30/30/c0c0e0/10',
                defaultPaths: [
                    [1, 2], [3, 2], [6, 1], [1, [4, 0]], [2, [1, 1]], [2, [2, 1]]
                ],
                treshold: 10
            }
            ,
            configuration: {
                lvlA: [
                    {
                        id: 1,
                        label: 'z1',
                        imgUrl: ''
                    },
                    {
                        id: 3,
                        label: 'z3',
                        imgUrl: ''
                    },
                    {
                        id: 5,
                        label: 'z5',
                        imgUrl: 'http://placeskull.com/30/50/e0e080/7'
                    },
                    {
                        id: 6,
                        label: 'z6',
                        imgUrl: ''
                    }
                ],

                lvlB: [
                    {
                        id: 1,
                        label: 'b1',
                        imgUrl: ''
                    },
                    {
                        id: 2,
                        label: 'b2',
                        imgUrl: ''
                    }
                ],

                lvlC: [
                    {
                        id: 1,
                        label: 's1',
                        imgUrl: ''
                    },
                    {
                        id: 2,
                        label: 's2',
                        imgUrl: 'http://placeskull.com/30/30/e0e080/10'
                    },
                    {
                        id: 4,
                        label: 's4',
                        imgUrl: ''
                    }
                ]
            }
        }
        ;

    }])
;