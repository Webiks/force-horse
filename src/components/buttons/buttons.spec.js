import "./buttons";

describe('Buttons Component', function () {
  let component = document.createElement('force-horse-buttons');

  let forceHorse = {
    options: {
      forceHorseInstance: {
        config: {
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
    }
  };

  beforeEach(function () {
    component.setForceHorse(JSON.parse(JSON.stringify(forceHorse)));
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
    'img-orphan-nodes': ['onOrphanNodesShowHideBtnClick', 'showOrphanNodesButton'],
  };

  Object.keys(buttonRules).forEach(className => {
    it('should activate click action of ' + className + ' button', function () {
      let a = false;
      component.forceHorse.options.forceHorseInstance[buttonRules[className][0]] = () => a = true;
      component.render();

      component.querySelector('i.' + className).click();

      expect(a).toBeTruthy();
    });

    if(buttonRules[className].length > 1) {
      it('should hide just ' + className + ' button', function () {
        component.forceHorse.options.forceHorseInstance.config[buttonRules[className][1]] = false;
        component.render();

        expect(component.querySelectorAll('i.img').length).toEqual(6);
        expect(component.querySelectorAll('i.' + className).length).toEqual(0);
      });
    }
  });

  it('should show img-pause-circle-outline and not img-play-circle-outline', function () {
    component.forceHorse.options.forceHorseInstance.fixedNodesMode = false;
    component.render();

    expect(component.querySelectorAll('.img-play-circle-outline').length).toEqual(0);
    expect(component.querySelectorAll('.img-pause-circle-outline').length).toEqual(1);
  });

  it('should show img-play-circle-outline and not img-pause-circle-outline', function () {
    component.forceHorse.options.forceHorseInstance.fixedNodesMode = true;
    component.render();

    expect(component.querySelectorAll('.img-play-circle-outline').length).toEqual(1);
    expect(component.querySelectorAll('.img-pause-circle-outline').length).toEqual(0);
  });

  it('should hide range input', function () {
    expect(component.querySelectorAll('input').length).toEqual(0);
  });

  it('should show range input', function () {
    component.forceHorse.options.forceHorseInstance.edgesFilteredByWeight.maxEdgeWeight = 2;
    component.render();

    expect(component.querySelectorAll('input').length).toEqual(1);
  });

  // TODO test change event for input
});