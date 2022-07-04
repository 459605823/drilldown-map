import {BaseObject} from '@q/pencil';
import * as THREE from 'three';
import config from './config';

export default class Light extends BaseObject {
  group = new THREE.Group();

  bbox: any[];

  guiParams = {
    lightGroup: {
      x: {
        value: 0,
        min: -500,
        max: 500,
        step: 1,
        target: () => this.group.position,
      },
      y: {
        value: 0,
        min: -500,
        max: 500,
        step: 1,
        target: () => this.group.position,
      },
      z: {
        value: 0,
        min: -500,
        max: 500,
        step: 1,
        target: () => this.group.position,
      },
    },
  };

  static options = {
    type: 'china',
  };

  create() {
    this.createLights(config);
  }

  setGui(
    name: string,
    light: THREE.Light,
    helper: THREE.SpotLightHelper | THREE.DirectionalLightHelper
  ) {
    const {gui} = this.pencil;
    if (!gui) return;
    if (light instanceof THREE.SpotLight) {
      const lightFolder = gui.addFolder(name);

      lightFolder.add(helper, 'visible');

      lightFolder
        .add(light.position, 'x', -500, 500, 10)
        .name('x')
        .onChange((val: any) => {
          light.position.setX(val);
        })
        .listen();

      lightFolder
        .add(light.position, 'y', -500, 500, 10)
        .name('y')
        .onChange((val: any) => {
          light.position.setY(val);
        })
        .listen();

      lightFolder
        .add(light.position, 'z', -500, 500, 10)
        .name('z')
        .onChange((val: any) => {
          light.position.setZ(val);
        })
        .listen();

      const controler = {
        rotateX: 0,
        rotateY: 90,
        rotateZ: 0,
        color: light.color.getHex(),
      };

      const {target} = light;

      lightFolder
        .add(target.position, 'x', -1000, 1000, 1)
        .name('targetX')
        .onChange((val: any) => {
          light.lookAt(target.position);
          light.target.position.setX(val);
        });
      lightFolder
        .add(target.position, 'y', -1000, 1000, 1)
        .name('targetY')
        .onChange((val: any) => {
          light.lookAt(target.position);
          light.target.position.setY(val);
        });
      lightFolder
        .add(target.position, 'z', -1000, 1000, 1)
        .name('targetZ')
        .onChange((val: any) => {
          light.lookAt(target.position);
          light.target.position.setZ(val);
        });

      lightFolder
        .add(light, 'distance', 0, 1000, 10)
        .name('distance')
        .onChange((val: any) => {
          light.distance = val;
          helper.update();
        });

      lightFolder
        .add(light, 'angle', 0, 1, 0.01)
        .name('angle')
        .onChange((val: any) => {
          light.angle = val;
          helper.update();
        });

      lightFolder
        .add(light, 'intensity', 0, 100, 1)
        .name('intensity')
        .onChange((val: any) => {
          light.intensity = val;
          helper.update();
        });
      lightFolder
        .add(light, 'penumbra', 0, 1)
        .name('penumbra')
        .onChange((val: any) => {
          light.penumbra = val;
          helper.update();
        });
      lightFolder
        .add(light, 'decay', 1, 10)
        .name('decay')
        .onChange((val: any) => {
          light.decay = val;
          helper.update();
        });

      lightFolder.addColor(controler, 'color').onChange((val: any) => {
        light.color = new THREE.Color(val);
      });
    }
    if (light instanceof THREE.DirectionalLight) {
      const lightFolder = gui.addFolder(name);
      lightFolder.add(helper, 'visible');
      const params = {
        color: light.color.getHex(),
      };
      lightFolder.addColor(params, 'color').onChange((val: any) => {
        light.color = new THREE.Color(val);
      });
      lightFolder.add(light, 'intensity', 0, 100);
      lightFolder.add(light.position, 'x', -500, 500).onChange((val: any) => {
        light.position.setX(val);
      });
      lightFolder.add(light.position, 'y', -500, 500).onChange((val: any) => {
        light.position.setY(val);
      });
      lightFolder.add(light.position, 'z', -500, 500).onChange((val: any) => {
        light.position.setZ(val);
      });
    }
  }

  createLights(lightSetting: typeof config) {
    const {isdev} = this.pencil.options;
    const {group} = this;
    this.bbox = [group];
    lightSetting.forEach((cfg, index) => {
      if (cfg.type === 'SpotLight') {
        const {
          color,
          position,
          intensity,
          distance,
          angle,
          penumbra,
          decay,
          target,
        } = cfg;
        const spotLight = new THREE.SpotLight(
          color,
          intensity,
          distance,
          angle,
          penumbra,
          decay
        );
        spotLight.position.copy(position);
        if (target) {
          spotLight.target.position.copy(target);
        }
        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        spotLightHelper.visible = false;
        group.add(spotLight);
        this.bbox.push(spotLight.target);
        if (isdev) {
          this.bbox.push(spotLightHelper);
          this.setGui(`SpotLight${index}`, spotLight, spotLightHelper);
        }
      } else if (cfg.type === 'DirectionLight') {
        const {color, intensity, position} = cfg;
        const dirLight = new THREE.DirectionalLight(color, intensity);
        dirLight.position.copy(position);
        const dirLightHelper = new THREE.DirectionalLightHelper(dirLight);
        dirLightHelper.visible = false;
        group.add(dirLight);
        this.bbox.push(dirLight.target);
        if (isdev) {
          this.bbox.push(dirLightHelper);
          this.setGui(`DirLight`, dirLight, dirLightHelper);
        }
      }
    });
    this.bbox.forEach((item) => this.pencil.scene!.add(item));
  }
}
