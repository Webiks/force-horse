# Revisiting Force-Horse: Making a Legacy Plugin Agnostic and Usable
For a while, we at Webiks used our own AngularJS D3.js library for graphs visualizations of real-life data sets, called "[Force-Horse](https://github.com/Webiks/force-horse)".

Force-Horse is an open source Javascript component wrapping a Force Layout and adding some functionalities we found very useful, like Adaptive tuning of forces and constraints parameters, Adaptive rendering cycle, Play/Pause the simulation, Multiple edges between two nodes, Weight the nodes and the edges, etc...

![Force Horse](http://webiks.com/wp-content/uploads/2016/07/force_horse-768x441.png)

While you can read all of the details on the library in Ram's [blog post](http://webiks.com/force-horse-force-layout-component/), the gist of it is having a library that adapts to many types of data sets, and is easily modifiable for the users, having many modes for nodes, D3.js forces, multiple edges between nodes, supporting any size of data set, and easily allowing customization of the base SVG's design.

## So... What's New?
Having the library written using AngularJS, forces the user to use a deprecated framework. Either the user thinks they can just include AngularJS in the bundle, increasing the bundle, or trying to implement the component for their used framework.
Therefore, we decided to remove the dependency for AngularJS, making the library framework agnostic.

##### Agnostification
We migrated AngularJS out of the library, moving to a standard browser feature - [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements), supported by most modern browsers, or being worked on at this time (In case it isn't supported, there is a tiny [browser polyfill](https://github.com/webcomponents/webcomponentsjs) - see [browsers support](https://caniuse.com/#search=custom%20elements%20v0))
What we love about using Custom Elements, is that all of the main frameworks - Angular, React, Vue, Polymer etc.. - support it for bindings of inputs and outputs, but you don't have to use a framework to use it.

##### Integration
We also made the component much easier to integrate, now creating 2 bundles - one for Javascript and one for CSS - and loading the images as a base64 mask directly inside the CSS, so there is no need when creating a distribution build to copy our assets anymore, just importing our CSS.

##### Tests
The original AngularJS component did not have many tests, so we could not ensure it was working for every user. Now, we added many unit tests for many use cases, to cover all of the grounds we need to be confidant in the stability of this awesome component.
For continues integration we now use Travis-CI, to automatically test and deploy the package.

##### Standards
It's 2017, so we ditched the old ES5 syntax, migrating the entire Javascript code base to ES6, taking advantage of the great things it offers.
Also, we moved from CSS to SCSS, for better style management and versatility.

##### Usage
Using Force-Horse is now as simple as using any other element. The new usage guide can be found in the [README](https://github.com/Webiks/force-horse).

### Wanna Help?
Working on something similar? [Contribute to our GitHub project](https://github.com/webiks/force-horse)
Thinking there is something we can improve on? [Let us know](https://github.com/webiks/force-horse/issues)
