import {ForceHorseProvider} from '../../providers/force-horse.provider';
import {debugLog} from '../../helpers/debug-logger/debug-logger';
import {EventEmitter} from '../../helpers/event-emitter/event-emitter';


export class ForceHorse extends HTMLElement {
  constructor() {
    super();

    this.readyEvent = new EventEmitter();

    this.instance = new ForceHorseProvider(this, this.render.bind(this));
    this.instance.readyEvent.subscribe(() => this.readyEvent.emit(this.instance));
  }

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
    delete this.instance;
  }

  setOptions(options) {
    this.instance.setOptions(options);
    this.instance.redraw();
  }

  // Fires when an attribute was added, removed, or updated.
  attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
    debugLog('ForceHorse:attributeChangedCallback', attributeName, oldValue, newValue, namespace);

    switch (attributeName) {
      case 'options':
        const options = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
        this.setOptions(options);
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