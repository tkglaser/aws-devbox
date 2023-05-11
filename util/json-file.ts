import * as fs from 'fs';
import * as path from 'path';

export class JsonFile<T = any> {
  private _content: T;
  private hasBeenRead = false;
  private readonly fileName: string;

  constructor(...paths: string[]) {
    this.fileName = path.join(...paths);
  }

  get content() {
    if (!this.hasBeenRead) {
      this._content = JSON.parse(fs.readFileSync(this.fileName).toString('utf8'));
      this.hasBeenRead = true;
    }
    return this._content;
  }

  set content(value: T) {
    this._content = value;
    fs.writeFileSync(this.fileName, JSON.stringify(value, undefined, 2));
  }
}
