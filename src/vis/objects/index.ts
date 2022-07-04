import {DrawController} from '@q/pencil';
import {Css2dBind, SpriteImage} from '@q/pencil/dist/objects';
import {PlaneMap, WorldBg, Materials, Area} from './map';
import Light from './light';
import Ocean from './ocean';

const objs = {
  PlaneMap,
  WorldBg,
  Light,
  Ocean,
  Css2dBind,
  SpriteImage,
};

export {Materials, PlaneMap, Area, WorldBg};

export default new DrawController(objs);
