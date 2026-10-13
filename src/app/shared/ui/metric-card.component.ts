import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContadorDirective } from '../movimento/contador.directive';

/**
 * Métrica: título, valor e legenda opcional. Sem caixa própria: quem usa
 * decide o fundo (assim a tela não vira uma grade de cartões iguais).
 * Se `centavos` vier, o valor conta até o número final (appContador).
 */
@Component({
  selector: 'app-metric-card',
  imports: [ContadorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="metrica">
      <h3 class="metrica__titulo">{{ titulo() }}</h3>
      @if (centavos() !== null) {
        <p class="metrica__valor numero" [appContador]="centavos()!"></p>
      } @else {
        <p class="metrica__valor numero">{{ valor() }}</p>
      }
      @if (legenda()) {
        <p class="metrica__legenda">{{ legenda() }}</p>
      }
    </article>
  `,
  styles: `
    .metrica { display: flex; flex-direction: column; gap: var(--espaco-1); }
    .metrica__titulo {
      font-family: var(--fonte);
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--cor-texto-suave);
    }
    .metrica__valor {
      margin: 0;
      font-size: clamp(1.5rem, 1.2rem + 1vw, 2rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      color: var(--verde-950);
    }
    .metrica__legenda {
      margin: 0;
      font-size: 0.875rem;
      color: var(--cor-texto-suave);
    }
  `,
})
export class MetricCardComponent {
  titulo = input.required<string>();
  valor = input('');
  centavos = input<number | null>(null);
  legenda = input<string>('');
}
