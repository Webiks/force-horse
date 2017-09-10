import './force-horse';
import {ForceHorseProvider} from '../../providers/force-horse';

describe('Force Horse Component', function () {
  let component, instance;

  let options = {
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

  beforeEach(function () {
    component = document.createElement('force-horse');
    component.connectedCallback();
    component.setAttribute('options', JSON.stringify(options));
    component.render();
    instance = component.instance;
  });

  it('should have class force-horse', function () {
    expect(component.classList.contains('force-horse')).toBeTruthy();
  });

  it('should have child force-horse-buttons', function () {
    expect(component.querySelectorAll('force-horse-buttons').length).toEqual(1);
  });

  it('should create a forceHorse instance', function () {
    expect(instance).toBeDefined();
    expect(instance instanceof ForceHorseProvider).toBeTruthy();
  });

  // it('should have child svg.graph-svg', function () {
  //   const spy = jasmine.createSpy('readySpy');
  //   instance.readyEvent.subscribe(() => {
  //     expect(component.querySelectorAll('svg.graph-svg').length).toEqual(1);
  //     spy();
  //   });
  //   instance.redraw();
  //
  //   expect(spy).toHaveBeenCalled();
  // });
});