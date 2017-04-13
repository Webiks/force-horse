# force-horse

An angular.js wrapper for a d3.js force fayout

#### USAGE

force-horse is implemented as an angular.js 1.4 directive. It can be used either as an HTML element or as an HTML element attribute.

`<force-horse options=”ctrl.options”&gt;&lt;/force-horse>`

or:

`<div force-horse options=”ctrl.options”></div>`

A force-horse element does not have an intrincsic size. It adapts itself to the size that is set by its parent. force-horse is implementing CSS **flex-box** display logic.

#  Options parameters

Parameters are passed through the options attribute. Currently, this object contains only the data property, which holds the graph's data in the following format:

**data**: the graph data (nodes and links):
```
  {
	  nodes: [],
	  edges: []
  }
```

# API
After initializing the directive, force-horse inserts an object into the `options` object sent to it.  This **`forceHorseInstance`** holds inside the force horse API methods. There is one **`forceHorseInstance`** per directive initialized:

**addEventListener** - accepts an event name (String) and a callback (function). For a list of events see **Events** section below.


# Events

These are the current events. PR's and suggestiong for more are welcome:
**hover**: a node/link is hovered upon

**select**: a node/link is selected

**dblclick**: a node/link is double-clicked upon

**filter**: remove the selected nodes/links from the graph

# External Config file
force-horse supports an external json file, **forceHorse.json**. In this file one can set whether each of the buttons (see below) is displayed or not. 
Also, force layout parameters can be set, and thus to override the parameters that force-horse computes automatically, for a specific implementation.

The config parameters are:
```
{
  "showLabels": false, //show labels on start
  "showNodeWeight": false, // show each node weight or uniform size
  "showEdgeWeight": false, // show each edge weight or uniform size
  "showFilterButton": true, // show the filter toggle button
  "showLabelsButton": true, // show the labels toggle button
  "showNodeWeightButton": true,  // show the nodes weights toggle button
  "showEdgeWeightButton": true, // show the edges weights toggle button
  "useEdgesWeights": false, //weather to use edges weights or simple edge sum for node weights
  "forceParameters": {
    "charge": -350,
    "linkStrength": 1,
    "gravity": 0.2,
    "linkDistance": 10,
    "friction": 0.5
  }
}
```

The forceHorse project contains a complete **demo application**. The demo application is also available on the [plunker](http://embed.plnkr.co/SYmehtaAnQVyMpLJJY2B/?show=preview) site.

#### VISUAL INTERFACE

On activation, force-horse shows the given graph. The graph stabilizes after a short force simulation. Then, if needed, it **zooms **out, so that the whole graph can be seen at a glance.

Beside showing the graph itself, force-horse provides visual indication of **hovering **over a node/link, and of **selecting **a node/link. It supports node **dragging**, and also **pan **and **zoom**.

In addition, force-horse is providing the following buttons:
* **filter**: remove selected nodes/links from the graph
* **pause/play**: allows to “freeze” the graph, to locate nodes without subsequent changes by the force-layout simulation
* **home**: automatically pan/zoom so that the whole graph can be seen at a glance
* **labels**: show/hide node labels
* **node weight**: show/hide node weight (weightier nodes will be larger)
* **link weight**: show/hide link weight (weightier links will be thicker)

#### DEPENDENCIES

The main dependencies of force-horse are:
* **angular.js** v1.4
* **d3.js** v3
A complete list can be found in file **bower.json** at the project’s root.

#### PERFORMANCE

force-horse was designed for high performance. Some of the measures in use are:
* minimal use of angular **$watch**’es
* large graphs are not rendered continuously, but only a few times during the force simulation. The screen rendering is controlled programmatically, implementing javascript**requestAnimationFrame**(). A thin **progress bar** is displayed, during a force simulation, so that even if rendering is held, the user can know the stage and the pace of the current force simulation.

#### MULTIPLE LINKS BETWEEN TWO NODES

The ability to compute multiple, parallel link between two nodes is not currently supported intrinsically by d3.js. It was also not yet developed by the users community. Therefore, we developed this ability especially for force-horse. For the mathematical and implementation details, see [here](http://webiks.com/d3-js-force-layout-straight-parallel-links/).

#### CONSOLE MESSAGES

Set localStorage.setItem('forceHorse', 'on') to get informative console messages from force-horse.