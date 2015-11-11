function ngEchoExtensionTest(options){
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
        options.$rootScope.echoConfig = {
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
        }; // set the echo configuration
        // turn all the words to lowercase
        angular.forEach(directiveName, function(part){
            part = part.toLowerCase();
        });
        // get the directive name to inject to the DOM
        directiveName = directiveName.join('-');
        // compile the element with echo and the extension
        options.element = options.$compile('<div echo-directive="echoConfig" ' + directiveName + '></div>')(options.$rootScope);
        options.isoScope = options.element.scope().$$childHead; // get the echo scope
        // get the created extension instnace
        options.extensionInstance = options.isoScope.echoCtrl.echoDirective.echoInstance[instanceName];

        return options;
    }));

    afterEach(function(){
        options.element.remove();
    });
}