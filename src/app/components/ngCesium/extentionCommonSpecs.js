function ngCesiumExtensionTest(options){
    beforeEach(module(options.extensionName));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$injector_) {
        options.$compile = _$compile_; // set $compile
        options.$rootScope = _$rootScope_; // set rootScope
        // get the directive's name
        var directiveName = options.extensionName.replace('ng', '').match(/[A-Z][a-z]+/g); // set the directive dom syntax
        // make the first word lower cased
        directiveName[0] = directiveName[0].toLowerCase();
        var instanceName = directiveName.join('');
        // get the factory
        options.factory = _$injector_.get(instanceName + 'Factory'); // set the factory
        options.$rootScope.cesiumConfig = {
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
        }; // set the cesium configuration
        // turn all the words to lowercase
        angular.forEach(directiveName, function(part){
            part = part.toLowerCase();
        });
        // get the directive name to inject to the DOM
        directiveName = directiveName.join('-');
        // compile the element with cesium and the extension
        options.element = options.$compile('<div cesium-directive="cesiumConfig" ' + directiveName + '></div>')(options.$rootScope);
        options.isoScope = options.element.scope().$$childHead; // get the cesium scope
        // get the created extension instnace
        options.extensionInstance = options.isoScope.cesiumCtrl.cesiumDirective.cesiumInstance[instanceName];

        return options;
    }));

    afterEach(function(){
        options.element.remove();
    });
}