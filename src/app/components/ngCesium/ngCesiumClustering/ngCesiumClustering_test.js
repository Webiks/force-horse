'use strict';

xdescribe('ngCesium Clustering module tests', function() {

    var $compile, $rootScope, element, ngCesiumClustering;
    beforeEach(module('ngCesiumClustering'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _ngCesiumClustering_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        ngCesiumClustering = _ngCesiumClustering_;
        $rootScope.cesiumConfig = {};
        element = $compile('<div cesium-directive="cesiumConfig" cesium-add-remove-buttons-directive></div>')($rootScope);
    }));

    describe('ngCesiumClustering directive tests', function() {
        it('ngCesiumClustering should be created with the cesium instance', function(){
            var isoScope = element.scope().$$childHead;
            expect(isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumClusterer).toBeDefined();
        });
    });

    describe('ngCesiumClustering factory tests', function() {
        it('ngCesiumClustering should be in the cesium instance', function(){
            var isoScope = element.scope().$$childHead;
            expect(isoScope.cesiumCtrl.cesiumDirective.cesiumInstance.cesiumClusterer).toBeDefined();
        });

    });
});