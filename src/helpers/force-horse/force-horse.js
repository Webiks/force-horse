import {FHConfig} from '../../config';
import * as d3 from 'd3';
import {debugLog} from '../debug-logger/debug-logger';

export class ForceHorseHelper {
  static getShape(shape) {
    debugLog('ForceHorseHelper:getShape', shape);

    if (typeof(shape) === 'string' || shape === undefined) {
      switch (shape) {
        case 'cross':
          return d3.symbolCross;
          break;
        case 'diamond':
          return d3.symbolDiamond;
          break;
        case 'square':
          return d3.symbolSquare;
          break;
        case 'triangle':
        case 'triangle-up':
        case 'triangle-down':
          return d3.symbolTriangle;
          break;
        case 'star':
          return d3.symbolStar;
          break;
        case 'wye':
          return d3.symbolWye;
          break;
        case undefined:
        case '':
        case 'circle':
        default:
          return d3.symbolCircle;
      }
    } else {
      return shape;
    }
  }

  /**
   * fileData is supposed to be in the format
   * {nodes: [nodeData, nodeData, ...] links: [linkData, linkData, ...]}
   * "edges" are also allowed, in place of "links".
   * If nodeData does not contain an id property, its id is set to its index in the array.
   * If nodeData does not contain a label property, it gets a default label.
   * A "class" property (node class) is also added to each nodeData.
   * Set node shape
   * If linkData does not contain an id property, its id is set to its index in the array.
   * If linkData does not contain an sourceID property, sourceID is set to source.
   * If linkData does not contain an targetID property, targetID is set to target.
   * A "class" property (link class) is also added to each linkData.
   * Also sourceLabel, targetLabel.
   * The resulting data is returned restructured like:
   * [ {id: constants.NODES_ID, data: nodesArray}, {id: constants.LINKS_ID, data: linksArray} ]
   */
  static convertFileDataFormat(fileData) {
    debugLog('ForceHorseHelper:convertFileDataFormat', fileData);

    // Process nodes
    const nodes = fileData.nodes;
    nodes.forEach((node, idx) => {
      if (node.id === undefined) {
        node.id = idx;
      }
      if (node.label === undefined) {
        node.label = String(node.id);
      }
      node.class = FHConfig.CLASS_NODE;
      node.shape = ForceHorseHelper.getShape(node.shape);
    });

    // Process edges
    const edges = (fileData.edges ? fileData.edges : fileData.links);
    edges.forEach(function (edge, idx) {
      if (edge.id === undefined) {
        edge.id = idx;
      }
      if (edge.sourceID === undefined) {
        edge.sourceID = edge.source;
      }
      if (edge.targetID === undefined) {
        edge.targetID = edge.target;
      }
      edge.sourceLabel = edge.sourceID;
      edge.targetLabel = edge.targetID;
      edge.class = FHConfig.CLASS_EDGE;
    });

    // Return the (processed) data
    return [
      {id: FHConfig.NODES_ID, data: nodes},
      {id: FHConfig.EDGES_ID, data: edges}
    ];
  }

  /**
   * Does the given string start with a hebrew letter?
   * @param {string} s
   */
  static isHebrewString(s) {
    debugLog('ForceHorseHelper:isHebrewString', s);

    const c = s.charAt(0);
    return (c >= 'א' && c <= 'ת');
  }

  /**
   * Calculate where to display edges, for the case of multiple edges between two nodes
   * @param basicOffset The desired distance from the parallel edge to the first edge
   * @param origDx The x-difference between the two end points of the first edge
   * @param origDy The y-difference between the two end points of the first edge
   */
  static calcRightAngledOffset(basicOffset, origDx, origDy) {
    debugLog('ForceHorseHelper:calcRightAngledOffset', basicOffset, origDx, origDy);

    let dx, dy;
    if (basicOffset === 0) {
      dx = dy = 0;
    } else if (origDy === 0 || Math.abs(origDx / origDy) > 1) {
      dy = -basicOffset * FHConfig.INNER_SVG_WIDTH / FHConfig.INNER_SVG_HEIGHT;
      dx = basicOffset * (origDy) / origDx;
    } else {
      dx = basicOffset;
      dy = basicOffset * (-origDx) / origDy;
    }
    if (isNaN(dx)) {
      console.warn(`calcRightAngledOffset: dx is not a number! basicOffset=${basicOffset} origDx=${origDx} origDy=${origDy}`);
    }
    return {dx: dx, dy: dy};
  }

  /**
   * Is rectangle rect1 contained in rectangle rect2?
   * @param {rect} rect1
   * @param {rect} rect2
   */
  static rectContained(rect1, rect2) {
    debugLog('ForceHorseHelper:rectContained', rect1, rect2);

    return rect1.left >= rect2.left && rect1.right <= rect2.right && rect1.top >= rect2.top && rect1.bottom <= rect2.bottom;
  }

  /**
   * Compute the friction parameter for the force-simulation, with a mysterious formula supplied by Omer.
   * @param {number} width_in_pixels Width of the simulation area
   * @param {number} height_in_pixels Height of the simulation area
   * @param {number} number_of_nodes No. of nodes in the graph
   */
  static computeFrictionParameter(width_in_pixels, height_in_pixels, number_of_nodes) {
    debugLog('ForceHorseHelper:computeFrictionParameter', width_in_pixels, height_in_pixels, number_of_nodes);

    const A = 0.0356,
      B = 1.162;
    let x = 100 * number_of_nodes / (height_in_pixels * width_in_pixels);
    if (x < 0.0634) {
      x = 0.0634;
    }
    return A * Math.pow(x, -B);
  }
}