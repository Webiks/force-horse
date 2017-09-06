import {EventEmitter} from './event-emitter';

describe('Event Emitter Helper', function () {
  let emitter, spy;
  beforeEach(function () {
    emitter = new EventEmitter();
    spy = jasmine.createSpy('subscriptionCallback');
  });

  it('should subscribe successfully', function () {
    emitter.subscribe(spy);
    emitter.emit();

    expect(spy).toHaveBeenCalled();
  });

  it('should un-subscribe successfully', function () {
    const subscription = emitter.subscribe(spy);
    emitter.emit(1);
    subscription.unsubscribe();
    emitter.emit(2);

    // Last call arguments are 1 and nothing else
    expect(spy.calls.mostRecent().args[0]).toEqual(1);
    expect(spy.calls.mostRecent().args.length).toEqual(1);
  });

  it('should emit multiple arguments', function () {
    emitter.subscribe(spy);
    emitter.emit(1, 2, 3);

    expect(spy).toHaveBeenCalledWith(1, 2, 3);
  });
});