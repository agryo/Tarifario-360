import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'placeholders',
  standalone: true,
})
export class SubstituirPlaceholdersPipe implements PipeTransform {
  transform(texto: string, vars: { [key: string]: string }): string {
    if (!texto) return texto;
    return texto.replace(/{(\w+)}/g, (match, chave) => {
      return vars.hasOwnProperty(chave) ? vars[chave] : match;
    });
  }
}
