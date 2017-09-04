import {debugLog} from './debug-logger';

describe('Debug Logger Helper', function () {
  beforeEach(function () {
    console.debug = jasmine.createSpy('debug');
  });

  it('should get log when requesting log to be on', function () {
    localStorage.setItem('force-horse', true);
    const logMessage = 'test';
    debugLog(logMessage);
    expect(console.debug).toHaveBeenCalledWith(logMessage);
  });

  it('should not get log when requesting log to be off', function () {
    localStorage.removeItem('force-horse');
    const logMessage = 'test';
    debugLog(logMessage);
    expect(console.debug.calls.mostRecent()).toBeUndefined();
  });
});