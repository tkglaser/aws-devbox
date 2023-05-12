import { BaseFile } from './base-file';

export class TextFile extends BaseFile<string[]> {
  protected parse(value: string): string[] {
    return value.split('\n');
  }
  protected stringify(value: string[]): string {
    return value.join('\n');
  }
  protected emptyValue(): string[] {
    return [];
  }
}
