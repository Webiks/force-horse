// define the ngCesiumFilter module (dependant on ngCesium)
angular.module('ngCesiumClustering', ['ngCesium'])
/**
 * @name cesiumClustering
 * @attrs cesiumClustering -> holds the groups definitions:
 * {
     *      defaultRadius: {float},
     *      dataSource: {*}, // can be either {int} (index of ds) or {string} (name of ds). if empty, uses the viewer's entities
     *      groups: {
     *          radius: {float}, // clustering radius of the group, in pixels (TODO::allow for meters)
     *          name: {string}, // group name
     *          color: {string},// group color (if none given, would be taken from cesiumClusteringConstants.colors)
     *          property: {*} // an entity's property to group by TODO::enable as a function for flexibility
     *      }
     * }
 */
    .directive('cesiumClustering', ['cesiumClusteringFactory', function (cesiumClusteringFactory) {
        return {
            restrict: 'A',
            require: 'cesiumDirective',
            link: function (scope, element, attrs, ctrl) {

                var options = scope.$eval(attrs.cesiumClustering);

                ctrl.cesiumClusteringInstance = new cesiumClusteringFactory(ctrl.cesiumDirective.cesiumInstance, options);
            }
        };
    }])
    .factory('cesiumClusteringFactory', ['$rootScope', 'cesiumClusteringConstants', 'cesiumClusteringGroup',
        function ($rootScope, cesiumClusteringConstants, cesiumClusteringGroup) {
            // constructor
            function cesiumClusteringFactory(ngCesiumInstance, config) {
                var that = this;
                that.groups = [];
                that.ngCesiumInstance = ngCesiumInstance;
                ngCesiumInstance.cesiumClustering = that;
                that.refreshConfig(config);
            }

            cesiumClusteringFactory.prototype = {
                /**
                 * @name cluster
                 * @description iterates over the groups and runs the cluster function for each group
                 */
                cluster: function cluster() {
                    var that = this;

                    for (var i = 0; i < that.groups.length; i++) {
                        that.clusterGroup(that.groups[i]);
                    }
                },
                /**
                 * @name clusterGroup
                 * @param groupData
                 * @description cluster the entities in each group
                 */
                clusterGroup: function clusterGroup(groupData) {
                    var that = this;


                },
                /**
                 * @name setGroups
                 * @description Divides the entities in the viewer to groups according to config. Entities that are in a group become hidden, while those that don't fit any group, remain shown.
                 * @returns {*} false for error, the groups array for success
                 */
                setGroups: function setGroups() {
                    var that = this;
                    if (angular.isUndefined(that.config)) {
                        return false;
                    }

                    // clear the groups
                    that.groups.length = 0;

                    // create the groups anew from config
                    for (var i = 0; i < that.config.groups.length; i++) {
                        that.createGroup(that.config.groups[i]);
                    }

                    // now for every entity, set it in a group
                    var entities = that.ngCesiumInstance._viewer.entities.values;
                    for (i = 0; i < entities.length; i++) {
                        that.setInGroup(entities[i]);
                    }

                    return that.groups;

                },
                /**
                 * @name createGroup
                 * @param group
                 * @description gets a group config and adds it to the list of groups in the instance
                 */
                createGroup: function createGroup(group) {
                    var that = this;

                    that.groups.push(new cesiumClusteringGroup(group, that.config));
                },
                /**
                 * @name setInGroup
                 * @param entity
                 * @description checks the entity vs. the groups and adds the entity to the group it belongs to (the first found).
                 * if it is indeed in a group, it "show" would be set to false.
                 */
                setInGroup: function setInGroup(entity) {
                    var that = this;
                    var propertyName, propertyValue;
                    for (var i = 0; i < that.groups.length; i++) {
                        // TODO::complete the "setInGroup" logic
                        propertyName = angular.isFunction(that.groups[i].property.name) ? that.groups[i].property.name() : that.groups[i].property.name;
                        propertyValue = angular.isFunction(that.groups[i].property.value) ? that.groups[i].property.value() : that.groups[i].property.value;

                        if ($rootScope.$eval(propertyName, entity) === propertyValue) {
                            that.groups[i].dataSource.entities.add(entity);
                            entity.show = false;
                            return i;
                        }
                    }
                    return -1;
                },
                /**
                 * @name setConfig
                 * @param config
                 * @description sets the config to a new config. Doesn't update the view immediately. In order to do that use "refreshConfig"
                 */
                setConfig: function setConfig(config) {
                    // TODO::config validations
                    var that = this;
                    that.config = config;
                },
                /**
                 * @name refreshConfig
                 * @param config
                 * @description gets a config object, sets it, parses it (divides into groups etc.) and then reruns the clustering
                 */
                refreshConfig: function refreshConfig(config) {
                    var that = this;
                    that.setConfig(config);
                    // TODO::refresh the data

                    // divide into groups again
                    that.setGroups();

                    // cluster anew
                    that.cluster();
                }
            };

            return cesiumClusteringFactory;
        }])

    .constant('cesiumClusteringConstants', {
        /**
         * holds 8 colors for 8 groups. If there are more than 8 groups without colors, colors will be repeated.
         * current holds the current color that is supposed to be chosen for the group
         */
        groupsColors: {
            colorsList: ['#C259C2', '#62B050', '#530C40', '#9E8C48', '#1B4D11', '#563D37', '#84959B', '#C74645', '#2F72BF', '#F6A050'],
            current: 0,
            /**
             *
             * @returns {*}
             */
            pickColor: function () {
                var that = this;

                if (that.current >= that.colorsList.length) {
                    that.current = 0;
                }

                return that.colorsList[that.current++];
            }
        }
    })

    .factory('cesiumClusteringGroup', ['cesiumClusteringConstants',
        function (cesiumClusteringConstants) {
        // constructor
        function cesiumClusteringGroup(group, config) {
            // TODO::validate group config
            var that = this;
            this.color = group.color ? group.color : cesiumClusteringConstants.groupsColors.pickColor();
            this.name = group.name;
            this.id = Math.random().toString(36).substring(7); //unique id...
            this.dataSource = new Cesium.CustomDataSource(this.id);
            this.radius = group.radius ? group.radius : config.defaultRadius;
            this.property = group.property;

            return this;
        }

        return cesiumClusteringGroup;
    }]);