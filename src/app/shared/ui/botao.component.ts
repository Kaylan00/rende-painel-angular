import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Botão do design system. Usa seletor de atributo para continuar sendo
 * um <button> de verdade (teclado, type="submit", disabled...):
 *   <button appBotao variante="perigo">Cancelar</button>
 */
@Component({
  selector: 'button[appBotao], a[appBotao]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'botao',
    '[class.botao--primario]': 'variante() === "primario"',
    '[class.botao--secundario]': 'variante() === "secundario"',
    '[class.botao--perigo]': 'variante() === "perigo"',
    '[class.botao--pequeno]': 'tamanho() === "pequeno"',
  },
  template: `<ng-content />`,
  styleUrl: './botao.component.scss',
})
export class BotaoComponent {
  variante = input<'primario' | 'secundario' | 'perigo'>('primario');
  tamanho = input<'normal' | 'pequeno'>('normal');
}
