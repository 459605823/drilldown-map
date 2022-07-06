import {DrawController} from '@q/pencil';
import {Css2dBind, SpriteImage, Line} from '@q/pencil/dist/objects';
import {PlaneMap, WorldBg, Materials, Area} from './map';
import Light from './light';
import Ocean from './ocean';
import Flyline from './flyline';

const objs = {
  PlaneMap,
  WorldBg,
  Light,
  Ocean,
  Css2dBind,
  SpriteImage,
  Line,
  Flyline,
};

export {Materials, PlaneMap, Area, WorldBg};

export default new DrawController(objs);
