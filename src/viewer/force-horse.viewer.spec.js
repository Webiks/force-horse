import {ForceHorseViewer} from './force-horse.viewer';

describe('Force Horse Provider', function () {
  let viewer, element;

  const data = [
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
  ];

  const recreateInstance = function () {
    element = document.createElement('div');
    viewer = new ForceHorseViewer(element, () => {
    });
    viewer.setData(data);
  };
  beforeEach(recreateInstance);

  afterEach(function () {
    element.remove();
  });

  describe('createInstanceName', function () {
    it('should assign the property instanceName', function () {
      viewer.createInstanceName();
      expect(viewer.instanceName).toBeDefined();
    });
  });

  describe('processInputData', function () {
    it('should assign nodeDataArray and edgeDataArray', function () {
      viewer.processInputData();
      expect(viewer.nodeDataArray).toEqual(data[0].data);
      expect(viewer.edgeDataArray).toEqual(data[1].data);
    });
  });

  describe('initNodeFields', function () {
    beforeEach(function () {
      viewer.processInputData();
      viewer.initNodeFields();
    });

    it('should assign property numOfNodes', function () {
      expect(typeof viewer.numOfNodes).toEqual('number');
    });

    it('should assign property nodeIconAreaDefault', function () {
      expect(typeof viewer.nodeIconAreaDefault).toEqual('number');
    });

    it('should assign property nodeIconRadius', function () {
      expect(typeof viewer.nodeIconRadius).toEqual('number');
    });

    it('should assign property selectedItems to be an array of length 2', function () {
      expect(viewer.selectedItems.length).toEqual(2);
    });

    it('should assign property fixedNodesMode false', function () {
      expect(viewer.fixedNodesMode).toEqual(false);
    });

    it('should assign property isFirstZoomDone false', function () {
      expect(viewer.isFirstZoomDone).toEqual(false);
    });

    it('should assign property isDragging false', function () {
      expect(viewer.isDragging).toEqual(false);
    });
  });

  describe('setConfig', function () {
    beforeEach(() => viewer.setConfig());

    it('should set property config', function () {
      expect(viewer.config).toBeDefined();
    });
  });

  describe('setForce', function () {
    beforeEach(() => {
      viewer.processInputData();
      viewer.setConfig();
      viewer.setForce();
    });

    it('should set property force', function () {
      expect(viewer.force).toBeDefined();
    });
  });

  describe('initLayout', function () {
    beforeEach(recreateInstance);

    const methods = ['createInstanceName', 'processInputData', 'initNodeFields', 'setForce', 'initCanvas', 'setSVGGroups'];
    methods.forEach(method => {
      it('Should call method ' + method, function () {
        viewer[method] = jasmine.createSpy(method);
        try {
          viewer.initLayout();
        } catch (e) {
          // Overriding a method can cause another method to error
        }
        expect(viewer[method]).toHaveBeenCalled();
      });
    });
  });

  describe('getRequiredNodeIconSize', function () {
    it('should return a number', function () {
      viewer.processInputData();
      viewer.initNodeFields();
      viewer.setConfig({});
      expect(typeof viewer.getRequiredNodeIconSize({edgesWeight: 2})).toEqual('number');
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
      //   viewer.readyEvent.subscribe(spy);
      //   return viewer.redraw()
      //     .then(() => expect(spy).toHaveBeenCalled())
      //     .then(done);
      // });
    });
  });
});