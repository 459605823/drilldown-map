import DelayedTick from './delayedTick';

export default class {
  private ticker_: DelayedTick | null;

  constructor(private onTick_: () => void) {
    this.ticker_ = null;
  }

  public tickNow() {
    this.stop();
    this.onTick_();

    return this;
  }

  public tickAfter(milliseconds: number) {
    this.stop();

    this.ticker_ = new DelayedTick(() => {
      this.onTick_();
    }).tickAfter(milliseconds);

    return this;
  }

  public tickEvery(milliseconds: number) {
    this.stop();

    this.ticker_ = new DelayedTick(() => {
      this.ticker_?.tickAfter(milliseconds);
      this.onTick_();
    }).tickAfter(milliseconds);

    return this;
  }

  public stop() {
    if (this.ticker_) {
      this.ticker_.stop();
      this.ticker_ = null;
    }
  }
}
