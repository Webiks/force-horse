import './buttons';

describe('Buttons Component', function () {
  let component = document.createElement('force-horse-buttons');

  let forceHorse = JSON.stringify({
    viewer: {
      config: {
        showButtons: true,
        showFilterButton: true,
        showLabelsButton: true,
        showEdgeWeightButton: true,
        showNodeWeightButton: true,
        showOrphanNodesButton: true
      },
      edgesFilteredByWeight: {
        maxEdgeWeight: 1
      }
    }
  });

  beforeEach(function () {
    component.setForceHorse(JSON.parse(forceHorse)); // Copy to avoid changes being set every time
    component.connectedCallback();
    component.render();
  });

  it('should have class force-horse-buttons', function () {
    expect(component.classList.contains('force-horse-buttons')).toBeTruthy();
  });

  it('should show all of the buttons', function () {
    expect(component.querySelectorAll('i.img').length).toEqual(7);
  });

  // Button class: [onClick, hide]
  const buttonRules = {
    'img-filter': ['onFilterInside', 'showFilterButton'],
    'img-pause-circle-outline': ['toggleFixedNodesMode'],
    'img-home': ['zoomToViewport'],
    'img-labels': ['onLabelsShowHideBtnClick', 'showLabelsButton'],
    'img-link-weight': ['onEdgeWeightShowHideBtnClick', 'showEdgeWeightButton'],
    'img-node-weight': ['onNodeWeightShowHideBtnClick', 'showNodeWeightButton'],
    'img-orphan-nodes': ['onOrphanNodesShowHideBtnClick', 'showOrphanNodesButton']
  };

  Object.keys(buttonRules).forEach(className => {
    it('should activate click action of ' + className + ' button', function () {
      const spy = jasmine.createSpy('callback');
      component.forceHorse.viewer[buttonRules[className][0]] = spy;
      component.render();

      component.querySelector('i.' + className).click();

      expect(spy).toHaveBeenCalled();
    });

    if (buttonRules[className].length > 1) {
      it('should hide just ' + className + ' button', function () {
        component.forceHorse.viewer.config[buttonRules[className][1]] = false;
        component.render();

        expect(component.querySelectorAll('i.img').length).toEqual(6);
        expect(component.querySelectorAll('i.' + className).length).toEqual(0);
      });
    }
  });

  it('should show all buttons', function () {
    component.forceHorse.viewer.config.showButtons = true;
    component.render();

    expect(component.querySelectorAll('i.img').length).toEqual(7);

  });

  it('should hide all buttons', function () {
    component.forceHorse.viewer.config.showButtons = false;
    component.render();

    expect(component.querySelectorAll('i.img').length).toEqual(0);
  });

  it('should show img-pause-circle-outline and not img-play-circle-outline', function () {
    component.forceHorse.viewer.fixedNodesMode = false;
    component.render();

    expect(component.querySelectorAll('.img-play-circle-outline').length).toEqual(0);
    expect(component.querySelectorAll('.img-pause-circle-outline').length).toEqual(1);
  });

  it('should show img-play-circle-outline and not img-pause-circle-outline', function () {
    component.forceHorse.viewer.fixedNodesMode = true;
    component.render();

    expect(component.querySelectorAll('.img-play-circle-outline').length).toEqual(1);
    expect(component.querySelectorAll('.img-pause-circle-outline').length).toEqual(0);
  });

  it('should hide range input', function () {
    expect(component.querySelectorAll('input').length).toEqual(0);
  });

  it('should show range input', function () {
    component.forceHorse.viewer.edgesFilteredByWeight.maxEdgeWeight = 2;
    component.render();

    expect(component.querySelectorAll('input[type="range"]').length).toEqual(1);
  });

  it('change should call change method on the range input', function () {
    component.forceHorse.viewer.edgesFilteredByWeight.maxEdgeWeight = 2;
    component.render();

    const spy = jasmine.createSpy('callback');
    component.forceHorse.viewer.onEdgesSelectedWeightLevelChange = spy;

    const newVal = 1;
    const input = component.querySelector('input[type="range"]');
    input.value = String(newVal);

    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    input.dispatchEvent(evt);

    expect(spy).toHaveBeenCalled();
    expect(Number(component.forceHorse.viewer.edgesFilteredByWeight.selectedWeightLevel)).toEqual(newVal);
  });

  it('disconnectedCallback should remove all of the DOM', function () {
    component.disconnectedCallback();
    expect(component.innerHTML).toBe('');
  });
});