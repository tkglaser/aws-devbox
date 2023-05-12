import * as fs from 'fs';
import * as path from 'path';

export abstract class BaseFile<T> {
  private _content: T;
  private hasBeenRead = false;
  private readonly fileName: string;

  constructor(...paths: string[]) {
    this.fileName = path.join(...paths);
  }

  protected abstract parse(value: string): T;
  protected abstract stringify(value: T): string;
  protected abstract emptyValue(): T;

  get content() {
    if (!this.hasBeenRead) {
      try {
        this._content = this.parse(fs.readFileSync(this.fileName).toString('utf8'));
      } catch (e) {
        if ((e as { code: 'ENOENT' }).code === 'ENOENT') {
          // doesn't exist yet, setting empty content
          this._content = this.emptyValue();
        } else {
          throw e;
        }
      }
      this.hasBeenRead = true;
    }
    return this._content;
  }

  set content(value: T) {
    this._content = value;
    fs.writeFileSync(this.fileName, this.stringify(value));
  }
}
