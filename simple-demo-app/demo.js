angular.module("demo", ['forceHorse'])

.controller('demoCtrl', function () {
   var vm = this;

    vm.options = {
        data: {
            nodes: [
                {label: 'Captain Sisko'},
                {label: 'Major Kira'},
                {label: 'Dr Bashir'},
                {label: 'Gol Dookat'}
            ],
            links: [
                {source: 0, target: 1},
                {source: 0, target: 2},
                {source: 0, target: 3}
            ]
        }
    };
});