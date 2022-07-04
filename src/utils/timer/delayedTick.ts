export default class {
  private cancelPending_: (() => void) | null;

  constructor(private onTick_: () => void) {
    this.cancelPending_ = null;
  }

  public tickAfter(delayInMilliseconds: number) {
    this.stop();

    let alive = true;
    let timeoutId: number | undefined;

    this.cancelPending_ = () => {
      clearTimeout(timeoutId);
      alive = false;
    };

    const onTick = () => {
      if (alive) {
        this.onTick_();
      }
    };

    timeoutId = window.setTimeout(onTick, delayInMilliseconds);

    return this;
  }

  public stop() {
    if (this.cancelPending_) {
      this.cancelPending_();
      this.cancelPending_ = null;
    }
  }
}
