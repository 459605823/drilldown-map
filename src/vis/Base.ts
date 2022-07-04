export default class Base {
  container: HTMLElement;

  options: Record<string, any>;

  private eventHandlers: Record<
    string,
    {
      node: HTMLElement;
      handler: (e: MouseEvent) => void;
      capture: boolean;
    }[]
  > = {};

  constructor(container: HTMLElement, options = {}) {
    container.classList.add('q-vis-wrap');
    this.container = container;
    this.options = {
      ...{staticPath: '/static/'},
      ...options,
    };
  }

  addListener(
    node: HTMLElement,
    event: string,
    handler: (e: MouseEvent) => void,
    capture = false
  ) {
    if (!(event in this.eventHandlers)) {
      this.eventHandlers[event] = [];
    }

    this.eventHandlers[event].push({
      node,
      handler,
      capture,
    });
    // @ts-ignore
    node.addEventListener(event, handler, capture);
  }

  removeListener(targetNode: HTMLElement | '', event: string) {
    this.eventHandlers[event]
      .filter(({node}) => (targetNode ? node === targetNode : true))
      .forEach(({node, handler, capture}) =>
        // @ts-ignore
        node.removeEventListener(event, handler, capture)
      );

    this.eventHandlers[event] = this.eventHandlers[event].filter(({node}) =>
      targetNode ? node !== targetNode : false
    );
  }

  removeAllListeners() {
    (
      Object.keys(this.eventHandlers) as (keyof Base['eventHandlers'])[]
    ).forEach((event) => {
      this.removeListener('', event);
    });
    this.eventHandlers = {};
  }
}
