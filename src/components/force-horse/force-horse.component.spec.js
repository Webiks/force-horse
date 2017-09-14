import './force-horse.component';
import {ForceHorseViewer} from '../../viewer/force-horse.viewer';

describe('Force Horse Component', function () {
  let component, viewer;

  let data = {
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
  };

  beforeEach(function () {
    component = document.createElement('force-horse');
    component.connectedCallback();
    component.setAttribute('data', JSON.stringify(data));
    component.render();
    viewer = component.viewer;
  });

  it('should have class force-horse', function () {
    expect(component.classList.contains('force-horse')).toBeTruthy();
  });

  it('should have child force-horse-buttons', function () {
    expect(component.querySelectorAll('force-horse-buttons').length).toEqual(1);
  });

  it('should create a forceHorse viewer', function () {
    expect(viewer).toBeDefined();
    expect(viewer instanceof ForceHorseViewer).toBeTruthy();
  });

  // it('should have child svg.graph-svg', function () {
  //   const spy = jasmine.createSpy('readySpy');
  //   viewer.readyEvent.subscribe(() => {
  //     expect(component.querySelectorAll('svg.graph-svg').length).toEqual(1);
  //     spy();
  //   });
  //   viewer.redraw();
  //
  //   expect(spy).toHaveBeenCalled();
  // });
});