'use strict';
describe('ngCesium Clustering module tests', function () {

    var options = {
        extensionName: 'ngCesiumClustering',
        extensionConfig: {
            propertyInScope: 'cesiumConfig.clusterConfig',
            propertyContent: {
                groups: [
                    // standart
                    {
                        name: 'group1',
                        color: '#654EA0',
                        property: {
                            name: 'type',
                            value: 'pizzeria'
                        }
                    },
                    // group value as a function
                    {
                        name: 'group2',
                        color: '#111AE9',
                        property: {
                            name: 'type',
                            value: function (entity) {
                                return entity.position.x > 10;
                            }
                        }
                    },
                    // no color
                    {
                        name: 'group3',
                        property: {
                            name: 'type',
                            value: 'group3'
                        }
                    }

                ]
            }
        }
    };

    ngCesiumExtensionTest(options);

    /*beforeEach(module('ngCesiumClustering'));

     beforeEach(inject(function(_$compile_, _$rootScope_, _cesiumClusteringFactory_) {
     $compile = _$compile_;
     $rootScope = _$rootScope_;
     cesiumClusteringFactory = _cesiumClusteringFactory_;
     $rootScope.cesiumConfig = {
     config: {
     baseLayerPicker: false,
     fullscreenButton: false,
     homeButton: false,
     sceneModePicker: false,
     selectionIndicator: false,
     timeline: false,
     animation: false,
     geocoder: false
     }
     };
     element = $compile('<div cesium-directive="cesiumConfig" cesium-clustering></div>')($rootScope);
     isoScope = element.scope().$$childHead;
     cesiumClustering = isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumClustering;
     }));*/

    describe('ngCesiumClustering directive tests', function () {

    });

    describe('ngCesiumClustering factory tests', function () {
        it('ngCesiumClustering should be in the cesium instance', function () {
            expect(options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumClustering).toBeDefined();
        });

        describe('clusterGroup(config) tests', function () {
            it('clusterGroup should start the clustering methods', function () {

            });
        });

        describe('cluster() tests', function () {
            it('cluster should call clusterGroup for all existing groups', function () {
                options.extensionInstance.groups = [1, 2];
                spyOn(options.extensionInstance, 'clusterGroup');
                options.extensionInstance.cluster();
                expect(options.extensionInstance.clusterGroup).toHaveBeenCalledWith(1);
                expect(options.extensionInstance.clusterGroup).toHaveBeenCalledWith(2);
            });
        });

        describe('refreshConfig(config) tests', function () {
            var config = {
                defaultRadius: 100,
                dataSource: undefined,
                groups: [
                    // standart
                    {
                        name: 'group1',
                        color: '#654EA0',
                        property: {
                            name: 'type',
                            value: 'pizzeria'
                        }
                    },
                    // group value as a function
                    {
                        name: 'group2',
                        color: '#111AE9',
                        property: {
                            name: 'type',
                            value: function (entity) {
                                return entity.position.x > 10;
                            }
                        }
                    },
                    // no color
                    {
                        name: 'group3',
                        property: {
                            name: 'type',
                            value: 'group3'
                        }
                    }

                ]
            };

            it('should call setConfig(config)', function () {
                spyOn(options.extensionInstance, 'setConfig');
                options.extensionInstance.refreshConfig(config);
                expect(options.extensionInstance.setConfig).toHaveBeenCalledWith(config);
            });

            it('should call setGroups()', function () {
                spyOn(options.extensionInstance, 'setGroups');
                options.extensionInstance.refreshConfig(config);
                expect(options.extensionInstance.setGroups).toHaveBeenCalled();
            });

            it('should call cluster()', function () {
                spyOn(options.extensionInstance, 'cluster');
                options.extensionInstance.refreshConfig(config);
                expect(options.extensionInstance.cluster).toHaveBeenCalled();
            });
        });

        describe('setGroups() tests', function () {

            function setData() {
                config = options.extensionInstance.config = {
                    defaultRadius: 100,
                    dataSource: undefined,
                    groups: [
                        // standart
                        {
                            name: 'group1',
                            color: '#654EA0',
                            property: {
                                name: 'type',
                                value: 'pizzeria'
                            }
                        },
                        // group value as a function
                        {
                            name: 'group2',
                            color: '#111AE9',
                            property: {
                                name: 'type',
                                value: 'burgers bar'
                            }
                        },
                        // no color
                        {
                            name: 'group3',
                            property: {
                                name: 'type',
                                value: 'group3'
                            }
                        }
                    ]
                };
                viewer = options.extensionInstance.ngCesiumInstance._viewer;
                // add entities - 5 groups, with 10 elements each for
                var i, j, entitySpecs = {};
                for (i = 0; i < config.groups.length; i++) {
                    entitySpecs[config.groups[i].property.name] = config.groups[i].property.value;
                    for (j = 0; j < 10; j++) {
                        viewer.entities.add(entitySpecs);
                    }
                }
            }

            var config, viewer;

            // set the data
            beforeEach(function () {
                setData();
            });

            // clear data after an "it"
            afterEach(function () {
                viewer.entities.removeAll();
                options.extensionInstance.groups.length = 0;
            });

            it('should return false if config does not exist', function () {
                options.extensionInstance.config = undefined;
                expect(options.extensionInstance.setGroups()).toBe(false);
            });

            it('should call createGroup()', function () {
                spyOn(options.extensionInstance, 'createGroup');
                options.extensionInstance.setGroups();
                expect(options.extensionInstance.createGroup.calls.count()).toEqual(3);
            });

            it('should call setInGroup(entity)', function () {
                spyOn(options.extensionInstance, 'setInGroup');
                options.extensionInstance.setGroups();
                expect(options.extensionInstance.setInGroup.calls.count()).toEqual(30);
            });

            it('should return the groups if success', function () {
                var expectedOutcome = options.extensionInstance.setGroups();
                expect(expectedOutcome.length).toBe(3);
                expect(expectedOutcome[0].dataSource.entities.values.length).toBe(10);
                expect(expectedOutcome[1].dataSource.entities.values.length).toBe(10);
                expect(expectedOutcome[2].dataSource.entities.values.length).toBe(10);
            });
        });

        describe('clusterGroup(group) tests', function(){
           //TODO::fill this up!
        });

        it('setConfig(config) should alter the config', function () {
            var config = {
                propertyInScope: 'cesiumConfig.clusterConfig',
                propertyContent: {
                    defaultRadius: 100,
                    dataSource: undefined,
                    groups: [
                        // standart
                        {
                            name: 'group1',
                            color: '#654EA0',
                            property: {
                                name: 'type',
                                value: 'pizzeria'
                            }
                        },
                        // group value as a function
                        {
                            name: 'group2',
                            color: '#111AE9',
                            property: {
                                name: 'type',
                                value: function (entity) {
                                    return entity.position.x > 10;
                                }
                            }
                        },
                        // no color
                        {
                            name: 'group3',
                            property: {
                                name: 'type',
                                value: 'group3'
                            }
                        }

                    ]
                }
            };
            options.extensionInstance.setConfig(config);
            expect(options.extensionInstance.config).toEqual(config);
        });

    });

    describe('ngCesiumClustering constant tests', function () {
        var clusteringConstans;
        beforeEach(inject(function (_cesiumClusteringConstants_) {
            clusteringConstans = _cesiumClusteringConstants_;
        }));

        describe('groupsColors tests', function () {
            var groupsColors;
            beforeEach(function () {
                groupsColors = clusteringConstans.groupsColors;
                groupsColors.current = 0;
            });

            it('pickColor should return the first color in the list', function () {
                var pickedColor = groupsColors.colorsList[0];
                expect(groupsColors.pickColor()).toEqual(pickedColor);
            });

            it('after choosing a color, the current should be 1', function () {
                groupsColors.pickColor();
                expect(groupsColors.current).toEqual(1);
            });

            it('after choosing a color when current is at max, the current should be 1 and the first color should be returned', function () {
                var expectedPickedColor = groupsColors.colorsList[0];
                groupsColors.current = groupsColors.colorsList.length;
                expect(groupsColors.pickColor()).toEqual(expectedPickedColor);
                expect(groupsColors.current).toEqual(1);
            });
        });


    });

    describe('cesiumClusteringGroup tests', function () {
        var cesiumClusteringGroup;
        var config = {
            defaultRadius: 100,
            dataSource: undefined,
            groups: [
                // standart
                {
                    name: 'group1',
                    color: '#654EA0',
                    property: {
                        name: 'type',
                        value: 'pizzeria'
                    }
                },
                // group value as a function
                {
                    name: 'group2',
                    color: '#111AE9',
                    property: {
                        name: 'type',
                        value: function (entity) {
                            return entity.position.x > 10;
                        }
                    }
                },
                // no color
                {
                    name: 'group3',
                    property: {
                        name: 'type',
                        value: 'group3'
                    }
                }

            ]

        };
        var result;
        beforeEach(inject(function (_cesiumClusteringGroup_) {
            cesiumClusteringGroup = _cesiumClusteringGroup_;
            result = new cesiumClusteringGroup(config.groups[0], config);
        }));

        describe('should create a group instance', function () {

            it('should set the name according to group name', function () {
                expect(result.name).toEqual('group1');
            });

            it('should set the color according to group color', function () {
                expect(result.color).toEqual('#654EA0');
            });

            it('should set a random id', function () {
                expect(result.id).toBeDefined();
            });

            it('should set a data source', function () {
                expect(result.dataSource).toBeDefined();
            });

            it('should set the radius according to defaults', function () {
                expect(result.radius).toEqual(100);
            });

            it('should set the radius according to group radius', function () {
                config.groups[0].radius = 50;
                result = new cesiumClusteringGroup(config.groups[0], config);
                expect(result.radius).toEqual(50);
            });


        })

    });
});