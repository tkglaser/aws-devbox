import * as fs from 'fs';
import * as path from 'path';

export class TextFile {
  private _content: string[];
  private hasBeenRead = false;
  private readonly fileName: string;

  constructor(...paths: string[]) {
    this.fileName = path.join(...paths);
  }

  get content() {
    if (!this.hasBeenRead) {
      this._content = fs.readFileSync(this.fileName).toString('utf8').split('\n');
      this.hasBeenRead = true;
    }
    return this._content;
  }

  set content(value: string[]) {
    this._content = value;
    fs.writeFileSync(this.fileName, value.join('\n'));
  }
}
