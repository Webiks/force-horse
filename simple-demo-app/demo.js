angular.module("demo", ['forceHorse'])

.controller('demoCtrl', function () {
   var vm = this;

    vm.options = {
        data: {
            nodes: [
                {label: 'Captain Sisko'},
                {label: 'Major Kira'},
                {label: 'Dr Bashir'},
                {label: 'Gol Dookat'},
                {label: 'Vedek Beriel'},
                {label: 'Vedek X'},
                {label: 'Garek'}
            ],
            links: [
                {source: 0, target: 1, weight: 3},
                {source: 0, target: 2, weight: 3},
                {source: 0, target: 3, weight: 3},
                {source: 1, target: 4},
                {source: 1, target: 5},
                {source: 2, target: 6},
                {source: 3, target: 6}
            ]
        }
    };
});