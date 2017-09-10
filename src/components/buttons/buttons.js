import {debugLog} from '../../helpers/debug-logger/debug-logger';

const buttonsDefinition = [
  {
    className: 'img-filter',
    title: 'Remove selected elements',
    hide: (config) => !config.showFilterButton,
    onClick: (instance) => instance.onFilterInside()
  },
  {
    className: (instance) => instance.fixedNodesMode ? 'img-play-circle-outline' : 'img-pause-circle-outline',
    title: 'Fix/release all nodes',
    onClick: (instance) => instance.toggleFixedNodesMode()
  },
  {
    className: 'img-home',
    title: 'Zoom to viewport',
    onClick: (instance) => instance.zoomToViewport()
  }, {
    className: (instance) => 'img-labels ' + (instance.config.showLabels ? 'img-label-outline' : 'img-label'),
    title: 'Show/hide labels',
    hide: (config) => !config.showLabelsButton,
    onClick: (instance) => instance.onLabelsShowHideBtnClick()
  }, {
    className: 'img-link-weight',
    title: 'Show/hide edge weight',
    hide: (config) => !config.showEdgeWeightButton,
    onClick: (instance) => instance.onEdgeWeightShowHideBtnClick()
  }, {
    className: 'img-node-weight',
    title: 'Show/hide node weight',
    hide: (config) => !config.showNodeWeightButton,
    onClick: (instance) => instance.onNodeWeightShowHideBtnClick()
  }, {
    className: 'img-orphan-nodes',
    title: 'Show/hide orphan nodes',
    hide: (config) => !config.showOrphanNodesButton,
    onClick: (instance) => instance.onOrphanNodesShowHideBtnClick()
  }
];

export class FHButtons extends HTMLElement {
  setForceHorse(forceHorse) {
    debugLog('FHButtons:setForceHorse', forceHorse);

    this.forceHorse = forceHorse;
  }

  // Fires when an instance of the element is created.
  connectedCallback() {
    debugLog('FHButtons:connectedCallback');

    // Add a class for the namespace
    this.classList.add('force-horse-buttons');
  }

  disconnectedCallback() {
    debugLog('FHButtons:disconnectedCallback');

    this.innerHTML = '';
  }

  render() {
    debugLog('FHButtons:render');

    if (!this.forceHorse.instance || !this.forceHorse.instance.config) {
      return;
    }

    const instance = this.forceHorse.instance;

    let elements = [];

    buttonsDefinition.forEach(button => {
      if (button.hide === undefined || !button.hide(instance.config)) {
        const element = document.createElement('i');
        element.setAttribute('title', button.title);
        element.setAttribute('class', 'img ' + (typeof button.className === 'string' ? button.className : button.className(instance)));
        element.addEventListener('click', () => button.onClick(instance));
        elements.push(element);
      }
    });

    if (instance.edgesFilteredByWeight.maxEdgeWeight > 1) {
      const input = document.createElement('input');
      input.setAttribute('type', 'range');
      input.setAttribute('title', 'Filter edges by weight');
      input.setAttribute('min', '1');
      input.setAttribute('max', String(instance.edgesFilteredByWeight.maxEdgeWeight));
      input.setAttribute('value', String(instance.edgesFilteredByWeight.selectedWeightLevel));
      input.addEventListener('change', () => {
        instance.edgesFilteredByWeight.selectedWeightLevel = input.value;
        instance.onEdgesSelectedWeightLevelChange();
      });
      elements.push(input);
    }


    this.innerHTML = '';
    elements.forEach(e => this.appendChild(e));
  }
}

customElements.define('force-horse-buttons', FHButtons);