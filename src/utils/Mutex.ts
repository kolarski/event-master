/**
 * A simple mutex class for ensuring atomic operations.
 */
export class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let begin: (unlock: () => void) => void = (_unlock) => {
      // Do nothing
    };

    this.mutex = this.mutex.then(() => new Promise(begin));

    return new Promise((res) => {
      begin = res;
    });
  }
}
