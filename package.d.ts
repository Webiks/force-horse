interface Node {
  id: string | number;
  label: string;
  shape?: 'circle' | 'wye' | 'star' | 'triangle' | 'square' | 'diamond' | 'cross';
  color?: string; // Hex
  svg?: string; // If given, it will render the given SVG instead of a shape
}

interface Link {
  id?: string;
  sourceID?: string;
  source: string;
  sourceLabel?: string;
  targetID?: string;
  target: string;
  targetLabel?: string;
  color?: string; // Hex
  class?: string;
  weight?: number;
}

interface ForceHorseData {
  nodes: Array<Node>,
  links: Array<Link>;
}

interface ForceHorseConfig {
  showButtons: boolean;
  showLabels: boolean;
  numOfLabelsToShow: number;
  showNodeWeight: boolean;
  showEdgeWeight: boolean;
  hideOrphanNodes: boolean;
  showFilterButton: boolean;
  showLabelsButton: boolean;
  showNodeWeightButton: boolean;
  showEdgeWeightButton: boolean;
  showOrphanNodesButton: boolean;
  forceParameters: {
    friction: number;
    charge: number;
    linkStrength: number;
    gravity: number;
    linkDistance: number;
  }
}

interface EventEmitter {
  subscribe: (callback: Function) => void;
}

interface ForceHorseViewer {
  element: ForceHorseComponent;

  doubleClickEvent: EventEmitter;
  hoverEvent: EventEmitter;
  selectEvent: EventEmitter;
  filterEvent: EventEmitter;

  nodeDataArray: Array<Node>;
  edgeDataArray: Array<Link>;
}

interface ForceHorseComponent extends HTMLElement {
  viewer: ForceHorseViewer;
  readyEvent: EventEmitter; // Every time a new viewer is created

  setData: (data: ForceHorseData) => void;
  setConfig: (config: ForceHorseConfig) => void;
}