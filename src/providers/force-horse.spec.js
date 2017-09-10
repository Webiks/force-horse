import {ForceHorseProvider} from './force-horse';

describe('Force Horse Provider', function () {
  let instance, element;

  const options = {
    data: [
      {
        id: 1, data: [
        {id: 1, label: 'first'},
        {id: 3, label: 'second'}
      ]
      },
      {
        id: 2, data: [
        {sourceID: 1, targetID: 3}
      ]
      }
    ]
  };

  const recreateInstance = function () {
    element = document.createElement('div');
    instance = new ForceHorseProvider(element, () => {
    });
    instance.setOptions(options);
  };
  beforeEach(recreateInstance);

  afterEach(function () {
    element.remove();
  });

  describe('createInstanceName', function () {
    it('should assign the property instanceName', function () {
      instance.createInstanceName();
      expect(instance.instanceName).toBeDefined();
    });
  });

  describe('processInputData', function () {
    it('should assign nodeDataArray and edgeDataArray', function () {
      instance.processInputData();
      expect(instance.nodeDataArray).toEqual(options.data[0].data);
      expect(instance.edgeDataArray).toEqual(options.data[1].data);
    });
  });

  describe('initNodeFields', function () {
    beforeEach(function () {
      instance.processInputData();
      instance.initNodeFields();
    });

    it('should assign property numOfNodes', function () {
      expect(typeof instance.numOfNodes).toEqual('number');
    });

    it('should assign property nodeIconAreaDefault', function () {
      expect(typeof instance.nodeIconAreaDefault).toEqual('number');
    });

    it('should assign property nodeIconRadius', function () {
      expect(typeof instance.nodeIconRadius).toEqual('number');
    });

    it('should assign property selectedItems to be an array of length 2', function () {
      expect(instance.selectedItems.length).toEqual(2);
    });

    it('should assign property fixedNodesMode false', function () {
      expect(instance.fixedNodesMode).toEqual(false);
    });

    it('should assign property isFirstZoomDone false', function () {
      expect(instance.isFirstZoomDone).toEqual(false);
    });

    it('should assign property isDragging false', function () {
      expect(instance.isDragging).toEqual(false);
    });
  });

  describe('setConfig', function () {
    beforeEach(() => instance.setConfig({}));

    it('should set property config', function () {
      expect(instance.config).toBeDefined();
    });
  });

  describe('setForce', function () {
    beforeEach(() => {
      instance.processInputData();
      instance.setConfig({});
      instance.setForce();
    });

    it('should set property force', function () {
      expect(instance.force).toBeDefined();
    });
  });

  describe('initLayout', function () {
    beforeEach(recreateInstance);

    const methods = ['createInstanceName', 'processInputData', 'initNodeFields', 'setConfig', 'setForce', 'initCanvas', 'setSVGGroups'];
    methods.forEach(method => {
      it('Should call method ' + method, function () {
        instance[method] = jasmine.createSpy(method);
        try {
          instance.initLayout();
        } catch (e) {
          // Overriding a method can cause another method to error
        }
        expect(instance[method]).toHaveBeenCalled();
      });
    });
  });

  describe('getRequiredNodeIconSize', function () {
    it('should return a number', function () {
      instance.processInputData();
      instance.initNodeFields();
      instance.setConfig({});
      expect(typeof instance.getRequiredNodeIconSize({ edgesWeight: 2 })).toEqual("number");
    });
  });

  describe('Event Listeners', function () {
    let spy;

    beforeEach(() => spy = jasmine.createSpy('eventSpy'));

    describe('Asynchronous', function () {
      beforeAll(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
      });
      // it('should emit event readyEvent', function (done) {
      //   instance.readyEvent.subscribe(spy);
      //   return instance.redraw()
      //     .then(() => expect(spy).toHaveBeenCalled())
      //     .then(done);
      // });
    });
  });
});