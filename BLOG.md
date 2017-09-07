# Revisiting Force-Horse: Making a Legacy Plugin Agnostic and Usable
For a long while, we at the company used our own AngularJS D3.js library for graphs visualizations of real-life data sets, called "[Force-Horse](https://github.com/Webiks/force-horse)".

Force-Horse is an open source Javascript component wrapping a Force Layout and adding some functionalities we found very useful, like Adaptive tuning of forces and constraints parameters, Adaptive rendering cycle, Play/Pause the simulation, Multiple edges between two nodes, Weight the nodes and the edges, etc...

![Force Horse](http://webiks.com/wp-content/uploads/2016/07/force_horse-768x441.png)

While you can read all of the details on the library in Ram's [blog post](http://webiks.com/force-horse-force-layout-component/), the gist of it is having a library that adapts to many types of data sets, and is easily modifiable for the users, having many modes for nodes, D3.js forces, multiple edges between nodes, supporting any size of data set, and easily allowing customization of the base SVG's design.

## So... What's New?
Having the library written using AngularJS, forces the user to use a deprecated framework. Either the user thinks they can just include AngularJS in the bundle, increasing the bundle, or trying to implement the component for their used framework.
Therefore, we decided to remove the dependency for AngularJS, making the library framework agnostic.

##### Agnostification
Therefore, we decided  to remove the dependency, migrating AngularJS out of the library, moving to a standard browser feature - [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements), supported by most browsers, or being worked on at this time (In case it isn't supported, there is a tiny browser polyfill - [see support](https://caniuse.com/#search=custom%20elements%20v0))
What’s good about using Custom Elements, is that all of the main frameworks - Angular, React, Vue, Polymer etc.. - support it for bindings of inputs and outputs, but you don't have to use a framework to use it.

##### Integration
We also made the component much easier to integrate, now creating 2 bundles - one for Javascript and one for CSS - and loading the images as a base64 mask directly inside the CSS, so there is no need when creating a distribution build to copy our assets anymore, just importing our CSS.

##### Tests
The original AngularJS component did not have many tests, so we could not ensure it was working for every user. Now, we added many unit tests for many use cases, to cover all of the grounds we need to be confidant in the stability of this awesome component.

##### Standards
It's 2017, so we ditched the old ES5 syntax, migrating the entire Javascript code base to ES6, taking advantage of the great things it offers.
Also, we moved from CSS to SCSS, for better style management and versatility.

## New Usage
### Loading:
With a modules bundler (recommended):
```js
import from 'force-horse'; // Imports the web component, not compiled
```
```scss
@import 'force-horse'; // Imports the SCSS index file
```
Directly from HTML:
```html
<link rel="stylesheet" type="text/css" href="node_modules/force-horse/dist/style.bundle.css" />
<script type="application/javascript" src="node_modules/force-horse/dist/main.bundle.js"></script>
```
### Using:
```html
<force-horse options='{"json": "options"}'></force-horse>
```

### Wanna Help?
Working on something similar? [Contribute to our GitHub project](https://github.com/webiks/force-horse)
Thinking we can improve? [Let us know](https://github.com/webiks/force-horse/issues)
