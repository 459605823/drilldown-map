import {DrawController} from '@q/pencil';
import {PlaneMap, WorldBg, Materials} from './map';
import Light from './light';
import Ocean from './ocean';

const objs = {
  PlaneMap,
  WorldBg,
  Light,
  Ocean,
};

export {Materials};

export default new DrawController(objs);
