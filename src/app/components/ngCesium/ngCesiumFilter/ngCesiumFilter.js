// define the ngCesiumFilter module (dependant on ngCesium)
angular.module('ngCesiumFilter', ['ngCesium'])
    .directive('cesiumFilter', function(cesiumFilterFactory){
        return {
            restrict: 'A',
            require: 'cesiumDirective',
            link: function(scope, element, attr, ctrl){
                // create an isolate scope for this directive
                var isoScope = scope.$new(true);
                // add parent's controller to the scope
                isoScope.cesiumFilterCtrl = ctrl;
                // create a cesiumButtonsInstance and add it to our controller
                isoScope.cesiumFilterCtrl.cesiumFilterInstance = new cesiumFilterFactory(ctrl.cesiumDirective.cesiumInstance);
            }
        };
    })
    .factory('cesiumFilterFactory', function($q){
        // constructor
        function cesiumFilterFactory(ngCesiumInstance){
            var that = this;
            that.ngCesiumInstance = ngCesiumInstance;
            ngCesiumInstance.cesiumFilter = that;

            that.filters = {};
            that.filtered = {};
        }

        cesiumFilterFactory.prototype = {
            /**
             * @name setFilter
             * @param options - holds the variables to create a filter from
             * options should hold:
             * Mandatory:
             * id - filter name (must be unique)
             * condition - a condition function to verify against
             * Options:
             * name - human readable name
             * callback - to call upon a response with entity and filter state
             * active - boolean to notify if filter is currently active             *
             */
            setFilter: function setFilter(options){
                if (angular.isUndefined(this.filters[options.id])){
                    this.filters[options.id] = {};
                }
                _.merge(this.filters[options.id],options); // add the filter to the
            },
            /**
             * @name filterEntities
             * @param filter {int} - the filter id we want to enact on the entities
             * @param entities {entityCollection} - holds the entities we want to filter
             */
            filterEntities: function filterEntities(filter, entities){

                var that = this;
                // if no filter was sent, there's nothing we can do (TODO:: developer error?)
                if (angular.isUndefined(filter) || angular.isUndefined(this.filters[filter])){
                    return;
                }

                filter = this.filters[filter]; //set the filter
                // if we did not get a specific entities collection,
                if (angular.isUndefined(entities)){
                    entities = this.ngCesiumInstance._viewer.entities.values;
                }

                if (!angular.isArray(entities)){
                    entities = entities.values;
                }

                // we can now start filtering according to the filter
                // go over all of the entities
                for (var i = 0; i<entities; i++){
                    // check condition
                    var passed = filter.condition(entities[i]);

                    // activate filter callback
                    if (filter.callback){
                        filter.callback(entities[i], passed);
                    }

                    // if the entity doesn't have a filter yet, create a filter object for it
                    if (angular.isUndefined(that.filtered[entities[i].id])){
                        that.filtered[entities[i].id] = [];
                    }

                    var entityFilter = that.filtered[entities[i].id];
                    var filterIndex = entityFilter.indexOf(filter.id); //find its index in the entity's filters array
                    if (passed){
                        // if the filter has passed
                        // if found, splice it
                        if (filterIndex > -1){
                            entityFilter.splice(filterIndex, 1);
                        }
                    }
                    else {
                        // the entity "failed" the filtering
                        // add the filter to the list of filters that are active on this entity
                        if (filterIndex > -1){
                            entityFilter.push(filter.id);
                        }
                    }

                    // if we have active filter(s) - hide, otherwise - show
                    entities[i].show = !entityFilter.length;

                    // now track the entities collection for changes, and if there's a deletion or an update of an entity
                    // redo the filter
                }
            }
        };

        return cesiumFilterFactory;
    });