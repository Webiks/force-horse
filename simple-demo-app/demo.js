angular.module("demo", ['forceHorse'])

.controller('demoCtrl', function () {
   var vm = this;

    vm.options = {
        data: {
            nodes: [
                {},
                {}
            ],
            links: [
                {source: 0, target: 1}
            ]
        }
    };
});