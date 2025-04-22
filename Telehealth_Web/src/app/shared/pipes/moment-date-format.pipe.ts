import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'momentDateFormat'
})
export class MomentDateFormatPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
