import { DotenvParseOutput, parse } from 'dotenv';

import { BaseFile } from './base-file';

export class EnvFile extends BaseFile<DotenvParseOutput> {
  static at(...paths: string[]) {
    return new this(paths);
  }

  protected parse(value: string): DotenvParseOutput {
    return parse(value);
  }

  protected stringify(value: DotenvParseOutput): string {
    return Object.entries(value).map(([key, value]) => `${key}=${value}`).join('\n');
  }

  protected emptyValue(): DotenvParseOutput {
    return {};
  }
}
