import { Pipe, PipeTransform } from '@angular/core';
import { formatarMoeda } from '../../core/utils/moeda';

/** {{ 1234 | moeda }} -> "R$ 12,34". Recebe SEMPRE centavos inteiros. */
@Pipe({ name: 'moeda' })
export class MoedaPipe implements PipeTransform {
  transform(centavos: number | null | undefined): string {
    return formatarMoeda(centavos ?? 0);
  }
}
