'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ui.router',
    'myApp.view3',
    'ngEcho',
    'ngEchoButtons',
    'ngEchoForm',
    'ngEchoHeader',
    'ngMaterial'
]).
    config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state('index', {
            url: "/home",
            templateUrl: 'app/views/main.html',
            controller: 'mainCtrl as mainCtrl',
            data: {
                title: 'Home'
            }
        });

    }])

    .controller('mainCtrl', ['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        var vm = this;
        vm.viewName = $state.current.data.title;
        vm.menuItems = $state.get();

        $rootScope.$on('$stateChangeSuccess',
            function (event, toState, toParams, fromState, fromParams) {
                vm.viewName = toState.data.title;
            }
        )


    }]);
