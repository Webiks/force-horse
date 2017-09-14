/**
 * A helper class to manage subscriptions to events
 */
export class Subscription {
  constructor(callback, emitter) {
    this.callback = callback;
    this.emitter = emitter;
  }

  next(...params) {
    this.callback(...params);
  }

  unsubscribe() {
    this.emitter.unsubscribe(this);
  }
}

/**
 * A helper class to manage events
 */
export class EventEmitter {
  constructor() {
    this.subscriptions = [];
  }

  subscribe(callback) {
    const sub = new Subscription(callback, this);
    this.subscriptions.push(sub);
    return sub;
  }

  emit(...params) {
    this.subscriptions.forEach(c => c.next(...params));
  }

  unsubscribe(subscription) {
    this.subscriptions = this.subscriptions.filter(s => s !== subscription);
  }
}