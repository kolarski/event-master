import { describe, it, expect } from "vitest";
import { Mutex } from "../src/utils/Mutex";

describe("Mutex", () => {
  it("should allow one lock at a time", async () => {
    const mutex = new Mutex();
    const lock1 = await mutex.lock();
    let lock2Resolved = false;

    mutex.lock().then(() => {
      lock2Resolved = true;
    });

    expect(lock2Resolved).toBe(false);
    lock1();
    await new Promise((r) => setTimeout(r, 0));
    expect(lock2Resolved).toBe(true);
  });

  it("should preserve the order of locks", async () => {
    const mutex = new Mutex();
    const order: number[] = [];

    const lock1 = await mutex.lock();
    order.push(1);

    const lock2Promise = mutex.lock().then((unlock) => {
      order.push(2);
      unlock();
    });

    const lock3Promise = mutex.lock().then((unlock) => {
      order.push(3);
      unlock();
    });

    expect(order).toEqual([1]);
    lock1();
    await lock2Promise;
    expect(order).toEqual([1, 2]);

    await lock3Promise;
    expect(order).toEqual([1, 2, 3]);
  });

  it("should handle multiple locks correctly", async () => {
    const mutex = new Mutex();
    const order: number[] = [];

    const lock1 = await mutex.lock();
    order.push(1);

    const lock2Promise = mutex.lock().then((unlock) => {
      order.push(2);
      setTimeout(() => {
        unlock();
      }, 100);
    });

    const lock3Promise = mutex.lock().then((unlock) => {
      order.push(3);
      setTimeout(() => {
        unlock();
      }, 100);
    });

    const lock4Promise = mutex.lock().then(() => {
      order.push(4);
    });

    expect(order).toEqual([1]);

    lock1();
    await lock2Promise;
    expect(order).toEqual([1, 2]);

    await lock3Promise;
    expect(order).toEqual([1, 2, 3]);

    await lock4Promise;
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it("should allow immediate re-locking after unlocking", async () => {
    const mutex = new Mutex();
    const order: number[] = [];

    const lock1 = await mutex.lock();
    order.push(1);
    lock1();

    const lock2 = await mutex.lock();
    order.push(2);
    lock2();

    expect(order).toEqual([1, 2]);
  });

  it("should block subsequent locks if no unlock is called", async () => {
    const mutex = new Mutex();
    const lock1 = await mutex.lock();
    let lock2Resolved = false;

    mutex.lock().then(() => {
      lock2Resolved = true;
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(lock2Resolved).toBe(false);

    // Clean up by unlocking the first lock
    lock1();
  });

  it("should handle concurrent locks with delayed unlocks", async () => {
    const mutex = new Mutex();
    const order: number[] = [];

    const lock1 = await mutex.lock();
    order.push(1);

    const lock2Promise = mutex.lock().then((unlock) => {
      order.push(2);
      setTimeout(() => {
        unlock();
      }, 50);
    });

    const lock3Promise = mutex.lock().then((unlock) => {
      order.push(3);
      setTimeout(() => {
        unlock();
      }, 150);
    });

    const lock4Promise = mutex.lock().then(() => {
      order.push(4);
    });

    lock1();
    await lock2Promise;
    expect(order).toEqual([1, 2]);

    await lock3Promise;
    expect(order).toEqual([1, 2, 3]);

    await lock4Promise;
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it("should not allow recursive locking by the same function", async () => {
    const mutex = new Mutex();
    const lock1 = await mutex.lock();

    let recursiveLockResolved = false;

    mutex.lock().then(() => {
      recursiveLockResolved = true;
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(recursiveLockResolved).toBe(false);

    // Clean up by unlocking the first lock
    lock1();
  });

  it("should handle stress test of rapid lock/unlock sequences", async () => {
    const mutex = new Mutex();
    const order: number[] = [];
    let promises: Array<Promise<void>> = [];

    for (let i = 1; i <= 100; i++) {
      promises.push(
        mutex.lock().then((unlock) => {
          order.push(i);
          unlock();
        })
      );
    }

    await Promise.all(promises);
    expect(order.length).toBe(100);
    expect(order).toEqual([...Array(100).keys()].map((i) => i + 1));
  });
});
