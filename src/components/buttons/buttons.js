import {debugLog} from '../../helpers/debug-logger/debug-logger';

const buttonsDefinition = [
  {
    className: 'img-filter',
    title: 'Remove selected elements',
    hide: (config) => !config.showFilterButton,
    onClick: (viewer) => viewer.onFilterInside()
  },
  {
    className: (viewer) => viewer.fixedNodesMode ? 'img-play-circle-outline' : 'img-pause-circle-outline',
    title: 'Fix/release all nodes',
    onClick: (viewer) => viewer.toggleFixedNodesMode()
  },
  {
    className: 'img-home',
    title: 'Zoom to viewport',
    onClick: (viewer) => viewer.zoomToViewport()
  }, {
    className: (viewer) => 'img-labels ' + (viewer.config.showLabels ? 'img-label-outline' : 'img-label'),
    title: 'Show/hide labels',
    hide: (config) => !config.showLabelsButton,
    onClick: (viewer) => viewer.onLabelsShowHideBtnClick()
  }, {
    className: 'img-link-weight',
    title: 'Show/hide edge weight',
    hide: (config) => !config.showEdgeWeightButton,
    onClick: (viewer) => viewer.onEdgeWeightShowHideBtnClick()
  }, {
    className: 'img-node-weight',
    title: 'Show/hide node weight',
    hide: (config) => !config.showNodeWeightButton,
    onClick: (viewer) => viewer.onNodeWeightShowHideBtnClick()
  }, {
    className: 'img-orphan-nodes',
    title: 'Show/hide orphan nodes',
    hide: (config) => !config.showOrphanNodesButton,
    onClick: (viewer) => viewer.onOrphanNodesShowHideBtnClick()
  }
];

export class FHButtons extends HTMLElement {
  setForceHorse(forceHorse) {
    debugLog('FHButtons:setForceHorse', forceHorse);

    this.forceHorse = forceHorse;
  }

  // Fires when an viewer of the element is created.
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

    if (!this.forceHorse.viewer || !this.forceHorse.viewer.config) {
      return;
    }

    this.innerHTML = '';

    if(!this.forceHorse.viewer.config.showButtons) {
      this.classList.add('hidden');
      return;
    }

    this.classList.remove('hidden');

    const viewer = this.forceHorse.viewer;

    let elements = [];

    buttonsDefinition.forEach(button => {
      if (button.hide === undefined || !button.hide(viewer.config)) {
        const element = document.createElement('i');
        element.setAttribute('title', button.title);
        element.setAttribute('class', 'img ' + (typeof button.className === 'string' ? button.className : button.className(viewer)));
        element.addEventListener('click', () => button.onClick(viewer));
        elements.push(element);
      }
    });

    if (viewer.edgesFilteredByWeight.maxEdgeWeight > 1) {
      const input = document.createElement('input');
      input.setAttribute('type', 'range');
      input.setAttribute('title', 'Filter edges by weight');
      input.setAttribute('min', '1');
      input.setAttribute('max', String(viewer.edgesFilteredByWeight.maxEdgeWeight));
      input.setAttribute('value', String(viewer.edgesFilteredByWeight.selectedWeightLevel));
      input.addEventListener('change', () => {
        viewer.edgesFilteredByWeight.selectedWeightLevel = input.value;
        viewer.onEdgesSelectedWeightLevelChange();
      });
      elements.push(input);
    }

    elements.forEach(e => this.appendChild(e));
  }
}

customElements.define('force-horse-buttons', FHButtons);