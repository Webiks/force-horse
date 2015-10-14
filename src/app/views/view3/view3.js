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

    .controller('view3Ctrl', ['$scope', function($scope) {
        console.log('In mainAppCtrl');
        var vm = this;

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
                submitCallback: function(formValues, paths) {}
            },
            // TODO::save the first configuration as the current configuration
            // TODO::expose "setCurrentConfiguration" to replace currectConfiguration
            // TODO::expose "setConfiguration" to replace presentation
            generalConfig: {
                lvlAImage: '',
                lvlBImage: '',
                lvlCImage: '',
                defaultPaths: [
                    [1,2], [3,2], [6,1], [1,[4,0]], [2,[1,1]], [2,[2,1]]
                ],
                treshold: 10
            },
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
                        imgUrl: ''
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
                        imgUrl: ''
                    },
                    {
                        id: 4,
                        label: 's4',
                        imgUrl: ''
                    }
                ]
            }
        };

    }]);