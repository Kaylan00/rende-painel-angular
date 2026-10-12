import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card de métrica: título, valor grande e uma legenda opcional. */
@Component({
  selector: 'app-metric-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <h3 class="card__titulo">{{ titulo() }}</h3>
      <p class="card__valor numero">{{ valor() }}</p>
      @if (legenda()) {
        <p class="card__legenda">{{ legenda() }}</p>
      }
    </article>
  `,
  styles: `
    .card {
      height: 100%;
      padding: var(--espaco-4);
      background: var(--cor-superficie);
      border: 1px solid var(--cor-borda);
      border-radius: var(--raio);
      box-shadow: var(--sombra);
    }
    .card__titulo {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--cor-texto-suave);
    }
    .card__valor {
      margin: var(--espaco-1) 0 0;
      font-size: 1.75rem;
      font-weight: 700;
    }
    .card__legenda {
      margin: var(--espaco-1) 0 0;
      font-size: 0.8125rem;
      color: var(--cor-texto-suave);
    }
  `,
})
export class MetricCardComponent {
  titulo = input.required<string>();
  valor = input.required<string>();
  legenda = input<string>('');
}
