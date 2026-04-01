import { BaseFile } from './base-file';

export class JsonFile<T = any> extends BaseFile<T> {
  static at<T = any>(...paths: string[]) {
    return new this<T>(paths);
  }

  protected parse(value: string): T {
    return JSON.parse(value);
  }

  protected stringify(value: T): string {
    return JSON.stringify(value, undefined, 2);
  }

  protected emptyValue(): T {
    return {} as T;
  }
}
