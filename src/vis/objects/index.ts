import {DrawController} from '@q/pencil';
import {PlaneMap, WorldBg, Materials, Area} from './map';
import Light from './light';
import Ocean from './ocean';

const objs = {
  PlaneMap,
  WorldBg,
  Light,
  Ocean,
};

export {Materials, PlaneMap, Area};

export default new DrawController(objs);
