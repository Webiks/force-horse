// define the ngCesiumFilter module (dependant on ngCesium)
angular.module('ngCesiumClustering', ['ngCesium'])
/**
 * @name cesiumClustering
 * @attrs cesiumClustering -> holds the groups definitions:
 * {
     *      defaultRadius: {float}, //radius in either pixels or km -> default is 100
     *      defaultRadiusType: {str}, //'pixels' or 'km' -> default is pixels
     *      dataSource: {*}, // can be either {int} (index of ds) or {string} (name of ds). if empty, uses the viewer's entities
     *      groups: {
     *          radius: {float}, // clustering radius of the group, in pixels (TODO::allow for meters)
     *          radiusType: {string}, //'pixels' or 'km' -> default is defaultRadiusType
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

                    var radiusInPixels = that.getRadius(groupData);
                    var entities = groupData.dataSource.entities.values;
                    for (var i = 0; i < entities.length; i++){
                        if (!that.addToCluster(entities[i], groupData)){
                            that.createCluster(entities[i], groupData);
                        }
                    }
                },
                /**
                 * @name addToCluster
                 * @param entity
                 * @param groupData
                 * @description gets an entity and checks if it fits into the cluster. If not, it returns false. If true, it adds it to the cluster by adding it to the polygon and to the list of entities in the cluster
                 */
                addToCluster: function addToCluster(entity, groupData){
                    var that = this;
                    // for each cluster
                    for (var i = 0; i < groupData.clusters.length; i++) {
                        // check if the entity is in it
                        if (that.isInRadius(that.getRadius(groupData), clusters[i].centerEntity, entity)) {
                            // add it to the polygon array
                            that.addPointToPolygoneArr(clusters[i].clusterArr, entity);
                            clusters[i].entities.push(entity);

                            // set the entities to show false
                            clusters[i].centerEntity.show = false;
                            entity.show = false;

                            return true;
                        }
                    }
                    return false;
                },
                addPointToPolygoneArr: function addPointToPolygoneArr(arr, point){
                    var cartographicPosition = this.cesiumInstance._viewer.scene.globe.ellipsoid.cartesianToCartographic(point.position.getValue(Cesium.JulianDate.now()));
                    var longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
                    var latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);

                    var point = {};
                    point.x= longitude;
                    point.y= latitude;

                    arr.push(point);
                    return arr;
                },
                /**
                 * @name isInRadius
                 * @param radius
                 * @param entity
                 * @param centerEntity
                 * @description gets a radius, an entity and a center and checks if the entity is within the circle's boundaris
                 * @returns {boolean}
                 */
                isInRadius: function isInRadius(radius, entity, centerEntity){
                    // get the distance between the entity and the center entity
                    var distance = Cesium.Cartesian3.distance(entity.position.getValue(Cesium.JulianDate.now()), centerEntity.position.getValue(Cesium.JulianDate.now()));
                    // see if it is less than the radius
                    return (distance < radius );
                },
                /**
                 * @name createCluster
                 * @param entity
                 * @param groupData
                 * @description gets an entity and groupsData and pushes a new cluster with the entity as its center
                 */
                createCluster: function createCluster(entity, groupData){
                    // clusterArr, centerEntity (should be show = true when created), entities
                    groupData.clusters.push({
                        clusterArr: [],
                        centerEntity: entity,
                        entities: [entity]
                    });
                    this.addPointToPolygoneArr(groupData.clusters[groupData.clusters.length-1].clusterArr, entity);
                },
                // TODO::test and comments
                getRadius: function getRadius(groupData){
                    if (groupData.radiusType === 'km'){
                        return groupData.radius;
                    }

                    // get width and height of the canvas
                    var width = this.cesiumInstance._viewer.canvas.width;
                    var height = this.cesiumInstance._viewer.canvas.height;

                    // get a good portion of the center of the canvas (20%)
                    var point1 = this.cesiumInstance._viewer.camera.pickEllipsoid(new Cesium.Cartesian2(width*40/100,height/2));
                    var point2 = this.cesiumInstance._viewer.camera.pickEllipsoid(new Cesium.Cartesian2(width*60/100,height/2));

                    // get the distance between the two points (40% to 60%)
                    var distanceInKilometers = Cesium.Cartesian3.distance(point1, point2);
                    // get km/pixel ratio
                    var distancePerPixel = distanceInKilometers/(width*20/100);
                    // get the radius distance in km
                    var distanceInPixels = distancePerPixel * groupData.radius;
                    return distanceInPixels;
                },
                /**
                 * @name divideIntoGroups
                 * @description Divides the entities in the viewer to the groups
                 */
                divideIntoGroups: function divideIntoGroups(){
                    // now for every entity, set it in a group
                    var that = this;
                    var entities = that.ngCesiumInstance._viewer.entities.values;
                    for (var i = 0; i < entities.length; i++) {
                        that.setInGroup(entities[i]);
                    }
                },
                /**
                 * @name setGroups
                 * @description Creates the groups according to config.
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
                            that.groups[i].members.push(entity);
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

                    // recreate the groups
                    that.setGroups();

                    // divide into the groups
                    that.divideIntoGroups();

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
            this.color = group.color ? group.color : cesiumClusteringConstants.groupsColors.pickColor() // group color
            this.name = group.name; // group name
            this.id = Math.random().toString(36).substring(7); //unique id...
            this.dataSource = new Cesium.CustomDataSource(this.id); // group dataSource
            this.members = []; // entities array
            this.clusters = []; // clusters array
            this.radius = group.radius ? group.radius : config.defaultRadius; // radius
            this.radiusType = group.radiusType ? group.radiusType : config.defaultRadiusType; // radius type (km or pixels)
            this.property = group.property; // property to group by

            return this;
        }



        return cesiumClusteringGroup;
    }]);