# force-horse

## Usage
### Installing
`npm install --save force-horse`
### Loading:
With a modules bundler (recommended):
```js
import 'force-horse'; // Imports the web component, not compiled
// OR
import 'force-horse/dist/main.bundle.js'; // Compiled. Less recommended because can't dedupe
```
```scss
@import 'force-horse/src/index.scss'; // Imports the SCSS index file, not compiled
// OR
@import 'force-horse/dist/style.bundle.css'; // Imports the bundle as CSS, compiled
```
Directly from HTML:
```html
<link rel="stylesheet" type="text/css" href="node_modules/force-horse/dist/style.bundle.css" />
<script type="application/javascript" src="node_modules/force-horse/dist/main.bundle.js"></script>
```
### Using:
From the template
```html
<!-- Web component -->
<force-horse data='{"nodes": [], "links": []}' config='{"anything": true}'></force-horse>
<!-- Angular: Note that you have to add CUSTOM_ELEMENTS_SCHEMA -->
<force-horse [attr.data]="data | json" [attr.config]="config | json"></force-horse>
```
From Javascript:
```js
const forceHorse = document.createElement("force-horse");
forceHorse.setConfig(someConfig);
forceHorse.setData(someData);
someContainer.appendChild(forceHorse);
```

To be rendered, force-horse must first get `data`, which can be passed as an attribute, or directly using `setData`

A force-horse element does not have an intrinsic size. It adapts itself to the size that is set by its parent.
force-horse is implementing CSS **flex-box** display logic.

# Attributes
## Data
The graph's data (nodes and links):
```json
  {
	"nodes": [{
	  "id": "string",
	  "label": "string",
	  "svg": "string|optional"
	}],
	"links": [{
	  "sourceId": "string",
	  "targetId": "string"
	}]
  }
```

## Config
Configure options in the component. Defaults to:
```json
{
  "showButtons": true,
  "showLabels": true,
  "numOfLabelsToShow": 10,
  "showNodeWeight": true,
  "showEdgeWeight": true,
  "hideOrphanNodes": false,
  "showFilterButton": true,
  "showLabelsButton": true,
  "showNodeWeightButton": true,
  "showEdgeWeightButton": true,
  "showOrphanNodesButton": true,
  "forceParameters": {
    "friction": 0.5,
    "charge": -100,
    "linkStrength": 1,
    "gravity": 0.3,
    "linkDistance": 10
  }
}
```

# API
You can use the API by querying the `force-horse` element, and accessing `viewer`.
```js
// In JS
const viewer = document.qeurySelector("force-horse").viewer;

// In Angular
// Template: `<force-horse #fh></force-horse>`
@ViewChild('fh') forceHorse: ElementRef;
ngAfterViewInit() {
  const viewer = this.forceHorse.viewer;
}
```

# Outputs

Outputs are event emitters. You can subscribe and unsubscribe in the following way:
```
const subscription = viewer.hoverEvent.subscribe(() => { /* some callback */);
subscription.unsubscribe();
```

These are the current events. PR's and suggestions for more are welcome:
**ready** (`readyEvent`): an SVG is drawn and ready

**hover** (`hoverEvent`): a node/link is hovered upon

**select** (`selectEvent`): a node/link is selected (`selectedItems: Array, isMultiple: boolean, currentSelected, currentData`)

**dblclick** (`doubleClickEvent`): a node/link is double-clicked upon

**filter** (`filterEvent`): remove the selected nodes/links from the graph

The forceHorse project contains a complete **demo application**. The demo application is also available on the [plunker](http://embed.plnkr.co/SYmehtaAnQVyMpLJJY2B/?show=preview) site.

#### VISUAL INTERFACE
On activation, force-horse shows the given graph. The graph stabilizes after a short force simulation. Then, if needed, it **zooms** out, so that the whole graph can be seen at a glance.

Beside showing the graph itself, force-horse provides visual indication of **hovering** over a node/link, and of **selecting** a node/link. It supports node **dragging**, and also **pan** and **zoom**.

In addition, force-horse is providing the following buttons:
* **filter**: remove selected nodes/links from the graph
* **pause/play**: allows to “freeze” the graph, to locate nodes without subsequent changes by the force-layout simulation
* **home**: automatically pan/zoom so that the whole graph can be seen at a glance
* **labels**: show/hide node labels
* **node weight**: show/hide node weight (weightier nodes will be larger)
* **link weight**: show/hide link weight (weightier links will be thicker)

#### DEPENDENCIES

The only dependency of force-horse is:
* **d3.js** v4

#### PERFORMANCE

force-horse was designed for high performance. Some of the measures in use are:
* minimal use of DOM manipulations
* large graphs are not rendered continuously, but only a few times during the force simulation. The screen rendering is controlled programmatically, implementing javascript**requestAnimationFrame**(). A thin **progress bar** is displayed, during a force simulation, so that even if rendering is held, the user can know the stage and the pace of the current force simulation.

#### MULTIPLE LINKS BETWEEN TWO NODES

The ability to compute multiple, parallel link between two nodes is not currently supported intrinsically by d3.js. It was also not yet developed by the users community. Therefore, we developed this ability especially for force-horse. For the mathematical and implementation details, see [here](http://webiks.com/d3-js-force-layout-straight-parallel-links/).

#### CONSOLE MESSAGES

Set `localStorage.setItem('force-horse', true)` to get informative console messages from force-horse.
To turn it off, remove that item by doing `localStorage.removeItem('force-horse')`
