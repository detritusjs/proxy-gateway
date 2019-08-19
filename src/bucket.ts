export type BucketItem = [Function, any];

export class Bucket {
  readonly queue: Array<BucketItem> = [];

  flushing = false;
  locked = true;

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
    this.shift();
  }

  add(func: Function, data: any) {
    if (this.locked || this.flushing) {
      this.queue.push([func, data]);
    } else {
      func(data);
    }
  }

  async flush() {
    this.flushing = true;
    this.locked = false;
    return new Promise((resolve) => {
      this.shift(resolve);
    });
  }

  async shift(cb?: Function) {
    if (!this.locked) {
      if (this.queue.length) {
        const [func, data] = <BucketItem> this.queue.shift();
        await func(data);
        this.shift(cb);
      } else {
        this.flushing = false;
        if (cb) {
          cb();
        }
      }
    }
  }

  reset() {
    this.queue.length = 0;
    this.locked = true;
    this.flushing = false;
  }
}
