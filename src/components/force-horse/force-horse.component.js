import {ForceHorseViewer} from '../../viewer//force-horse.viewer';
import {debugLog} from '../../helpers/debug-logger/debug-logger';
import {EventEmitter} from '../../helpers/event-emitter/event-emitter';


export class ForceHorse extends HTMLElement {
  constructor() {
    super();

    this.readyEvent = new EventEmitter();

    this.instance = new ForceHorseViewer(this, this.render.bind(this));
    this.instance.readyEvent.subscribe(() => this.readyEvent.emit(this.instance));
  }

  static get observedAttributes() {
    return ['data', 'config'];
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

  setData(data) {
    this.instance.setData(data);
    this.instance.redraw();
  }

  setConfig(config) {
    this.instance.setConfig(config);
    if (this.instance.data) {
      this.instance.redraw();
    }
  }

  // Fires when an attribute was added, removed, or updated.
  attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
    debugLog('ForceHorse:attributeChangedCallback', attributeName, oldValue, newValue, namespace);

    newValue = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;

    switch (attributeName) {
      case 'data':
        this.setData(newValue);
        break;
      case 'config':
        this.setConfig(newValue);
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