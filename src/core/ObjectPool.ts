export interface IPoolable {
  active: boolean;
  reset(...args: any[]): void;
}

export class ObjectPool<T extends IPoolable> {
  private pool: T[] = [];
  private factory: () => T;
  private maxCapacity: number;

  constructor(factory: () => T, initialSize: number = 20, maxCapacity: number = 200) {
    this.factory = factory;
    this.maxCapacity = maxCapacity;

    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  public get(...initArgs: any[]): T {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        this.pool[i].reset(...initArgs);
        return this.pool[i];
      }
    }

    if (this.pool.length < this.maxCapacity) {
      const newObj = this.factory();
      newObj.active = true;
      newObj.reset(...initArgs);
      this.pool.push(newObj);
      return newObj;
    }

    const recycled = this.pool[0];
    recycled.active = true;
    recycled.reset(...initArgs);
    return recycled;
  }

  public release(obj: T): void {
    obj.active = false;
  }

  public releaseAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }

  public getActiveObjects(): T[] {
    return this.pool.filter(obj => obj.active);
  }

  public forEachActive(callback: (obj: T, index: number) => void): void {
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        callback(this.pool[i], i);
      }
    }
  }
}
