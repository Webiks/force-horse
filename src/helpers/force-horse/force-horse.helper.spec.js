import * as d3 from 'd3';
import {ForceHorseHelper} from './force-horse.helper';

describe('Force Horse Helper', function () {
  describe('getShape', function () {
    const shapes = {
      '': d3.symbolCircle, // default shape
      'randomString_For-Real': d3.symbolCircle, // random -> default shape
      circle: d3.symbolCircle,
      cross: d3.symbolCross,
      diamond: d3.symbolDiamond,
      square: d3.symbolSquare,
      triangle: d3.symbolTriangle,
      'triangle-up': d3.symbolTriangle,
      'triangle-down': d3.symbolTriangle,
      star: d3.symbolStar,
      wye: d3.symbolWye
    };

    Object.keys(shapes).forEach(shape => {
      it(`shape ${shape} should return ${shape.constructor.name}`, function () {
        expect(ForceHorseHelper.getShape(shape)).toEqual(shapes[shape]);
      });
    });

    it(`shape which is not a string should return itself`, function () {
      expect(ForceHorseHelper.getShape(1)).toEqual(1);
    });
  });

  describe('convertFileDataFormat', function () {
    const fileData = {
      nodes: [
        {label: 'Captain Sisko'}
      ],
      links: [
        {source: 0, target: 1, weight: 3}
      ]
    };

    it('should convert file data to correct format', function () {
      const converted = ForceHorseHelper.convertFileDataFormat(fileData);
      expect(converted.length).toEqual(2);

      expect(converted[0].id).toEqual(1);
      expect(converted[0].data.length).toEqual(1);
      expect(converted[0].data[0].label).toEqual(fileData.nodes[0].label);
      expect(converted[0].data[0].id).toEqual(0);
      expect(converted[0].data[0].class).toEqual('Node');
      expect(converted[0].data[0].shape).toEqual(d3.symbolCircle);

      expect(converted[1].id).toEqual(2);
      expect(converted[1].data.length).toEqual(1);
      expect(converted[1].data[0].source).toEqual(fileData.links[0].source);
      expect(converted[1].data[0].target).toEqual(fileData.links[0].target);
      expect(converted[1].data[0].weight).toEqual(fileData.links[0].weight);
      expect(converted[1].data[0].id).toEqual(0);
      expect(converted[1].data[0].sourceID).toEqual(fileData.links[0].source);
      expect(converted[1].data[0].targetID).toEqual(fileData.links[0].target);
      expect(converted[1].data[0].sourceLabel).toEqual(fileData.links[0].source);
      expect(converted[1].data[0].targetLabel).toEqual(fileData.links[0].target);
      expect(converted[1].data[0].class).toEqual('Edge');
    });
  });

  describe('isHebrewString', function () {
    it('should be a hebrew string', function () {
      expect(ForceHorseHelper.isHebrewString('בדיקה')).toBeTruthy();
    });

    it('should not be a hebrew string', function () {
      expect(ForceHorseHelper.isHebrewString('test')).toBeFalsy();
    });
  });

  describe('calcRightAngledOffset', function () {
    it('should be the correct offset for predetermined data', function () {
      let offset;

      offset = ForceHorseHelper.calcRightAngledOffset(100, 100, 5);
      expect(offset.dx).toEqual(5);
      expect(offset.dy).toEqual(-112.5);

      offset = ForceHorseHelper.calcRightAngledOffset(20, 10, 5);
      expect(offset.dx).toEqual(10);
      expect(offset.dy).toEqual(-22.5);
    });
  });

  describe('rectContained', function () {
    // Yes, it looks funky, but this is how it works
    const rect1 = {left: 100, right: 0, top: 100, bottom: 0};
    const rect2 = {left: 0, right: 100, top: 0, bottom: 100};

    it('rect should be contained', function () {
      expect(ForceHorseHelper.rectContained(rect1, rect2)).toBeTruthy();
    });

    it('rect should not be contained', function () {
      expect(ForceHorseHelper.rectContained(rect2, rect1)).toBeFalsy();
    });
  });

  describe('computeFrictionParameter', function () {
    it('should be the correct friction for predetermined data', function () {
      expect(ForceHorseHelper.computeFrictionParameter(100, 100, 5)).toEqual(0.8778539756363036);
      expect(ForceHorseHelper.computeFrictionParameter(20, 10, 5)).toEqual(0.012275627682701733);
    });
  });
});