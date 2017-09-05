import {ForceHorseProvider} from '../../providers/force-horse';
import {debugLog} from '../../helpers/debug-logger/debug-logger';


export class ForceHorse extends HTMLElement {
  static get observedAttributes() {
    return ['options'];
  }

  // Fires when an instance of the element is created.
  connectedCallback() {
    debugLog('ForceHorse:connectedCallback');

    // Add a class for the namespace
    this.classList.add('force-horse');

    this.buttons = document.createElement('force-horse-buttons');
    this.buttons.setForceHorse(this);
    this.appendChild(this.buttons);
  }

  disconnectedCallback() {
    debugLog('ForceHorse:disconnectedCallback');

    // Clear the instance reference on destruction, to prevent memory leak
    this.options.forceHorseInstance = null;
  }

  // Fires when an attribute was added, removed, or updated.
  attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
    debugLog('ForceHorse:attributeChangedCallback', attributeName, oldValue, newValue, namespace);

    switch (attributeName) {
      case 'options':
        this.options = JSON.parse(newValue);
        this.options.forceHorseInstance = new ForceHorseProvider(this, this.options, this.render.bind(this));
        this.options.forceHorseInstance.redraw();
        break;
      default:
        console.warn('No attribute handler changed for', attributeName);
    }
  }

  render() {
    this.buttons.render();
  }
}

customElements.define('force-horse', ForceHorse);