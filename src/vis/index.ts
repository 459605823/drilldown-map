import Pencil from '@q/pencil';

import Base from '@/vis/Base';

import drawController from './objects';

const IS_DEV = process.env.NODE_ENV === 'development';

export default class extends Base {
  pencil?: Pencil;

  initReday = false;

  on(eventName: string | symbol, listener: (...args: any[]) => void) {
    this.pencil!.event.on(eventName, listener);
  }

  constructor(container: HTMLElement) {
    super(container);
    const pencil = new Pencil(
      {
        isdev: IS_DEV,
        stats: IS_DEV,
        gui: IS_DEV,
        axesHelper: IS_DEV,
        container: this.container,
        control: true,
        light: false,
      },
      drawController
    );

    this.pencil = pencil;

    if (pencil.options.isdev) {
      // @ts-ignore
      window.pencil = pencil;
    }
  }

  async init() {
    const pencil = this.pencil!;
    if (!pencil.options.isdev) {
      // pencil.control!.enabled = false;
    }
    await this.draw();

    pencil.start();

    this.initReday = true;
  }

  draw() {}

  dispose() {
    this.pencil!.dispose();

    this.removeAllListeners();

    this.pencil = undefined;
  }
}
