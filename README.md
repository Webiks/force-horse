# force-horse

#### USAGE

force-horse is implemented as a web component, so you can use it as an element:

`<force-horse></force-horse>`

or from JS:

`document.createElement('force-horse')`

To be rendered, force-horse must first get `options`, which is an attribute.

A force-horse element does not have an intrinsic size. It adapts itself to the size that is set by its parent.
force-horse is implementing CSS **flex-box** display logic.

#  Options attribute

Parameters are passed through the options attribute. Currently, this object contains only the data property, which holds the graph's data in the following format:

**data**: the graph data (nodes and links):
```
  {
	  nodes: [],
	  edges: []
  }
```

# API
After initializing the directive, force-horse inserts an object into the `options` object sent to it.
This **`forceHorseInstance`** holds inside the force horse API methods. There is one **`forceHorseInstance`** per directive initialized:

To use it, simply find the instance of `force-horse`, and call `element.options.forceHorseInstance`

# Outputs

Outputs are event emitters. You can subscribe and unsubscribe in the following way:
```
const instance = element.options.forceHorseInstance;
const subscription = instance.hoverEvent.subscribe(() => { /* some callback */);
subscription.unsubscribe();
```

These are the current events. PR's and suggestions for more are welcome:
**hover** (`hoverEvent`): a node/link is hovered upon

**select** (`selectEvent`): a node/link is selected

**dblclick** (`doubleClickEvent`): a node/link is double-clicked upon

**filter** (`filterEvent`): remove the selected nodes/links from the graph

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

The only dependency of force-horse is:
* **d3.js** v4

#### PERFORMANCE

force-horse was designed for high performance. Some of the measures in use are:
* minimal use of DOM manipulations
* large graphs are not rendered continuously, but only a few times during the force simulation. The screen rendering is controlled programmatically, implementing javascript**requestAnimationFrame**(). A thin **progress bar** is displayed, during a force simulation, so that even if rendering is held, the user can know the stage and the pace of the current force simulation.

#### MULTIPLE LINKS BETWEEN TWO NODES

The ability to compute multiple, parallel link between two nodes is not currently supported intrinsically by d3.js. It was also not yet developed by the users community. Therefore, we developed this ability especially for force-horse. For the mathematical and implementation details, see [here](http://webiks.com/d3-js-force-layout-straight-parallel-links/).

#### CONSOLE MESSAGES

Set `localStorage.setItem('force-horse', true)` to get informative console messages from force-horse.
To turn it off, remove that item by doing `localStorage.removeItem('force-horse')`
