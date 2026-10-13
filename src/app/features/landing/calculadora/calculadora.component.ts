import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatarMoeda } from '../../../core/utils/moeda';
import { ContadorDirective } from '../../../shared/movimento/contador.directive';
import { RevelarDirective } from '../../../shared/movimento/revelar.directive';
import { compararCustos, COMISSAO_APP_BPS, MENSALIDADE_RENDE_CENTAVOS } from '../comparativo';

export const FATURAMENTO_MIN_REAIS = 2_000;
export const FATURAMENTO_MAX_REAIS = 120_000;

/**
 * Calculadora "comissão do app x mensalidade fixa".
 * Estado em signals (faturamento e comissão vêm dos sliders) e o resultado é um computed:
 * mexeu no slider, tudo recalcula sozinho, sem subscribe.
 */
@Component({
  selector: 'app-calculadora',
  imports: [ContadorDirective, RevelarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculadora.component.html',
  styleUrl: './calculadora.component.scss',
})
export class CalculadoraComponent {
  protected readonly minimo = FATURAMENTO_MIN_REAIS;
  protected readonly maximo = FATURAMENTO_MAX_REAIS;
  protected readonly mensalidade = formatarMoeda(MENSALIDADE_RENDE_CENTAVOS);

  /** Faturamento mensal em reais (o slider trabalha em reais; a conta, em centavos). */
  readonly faturamentoReais = signal(30_000);
  /** Comissão do app em % inteiro. */
  readonly comissaoPct = signal(COMISSAO_APP_BPS / 100);

  readonly resultado = computed(() => compararCustos(this.faturamentoReais() * 100, this.comissaoPct() * 100));

  /** Largura das barras (em %) relativa ao faturamento. */
  protected readonly barraApp = computed(() => this.proporcao(this.resultado().sobraAppCentavos));
  protected readonly barraRende = computed(() => this.proporcao(this.resultado().sobraRendeCentavos));

  protected readonly faturamentoTexto = computed(() => formatarMoeda(this.faturamentoReais() * 100));

  protected mudarFaturamento(evento: Event) {
    this.faturamentoReais.set(Number((evento.target as HTMLInputElement).value));
  }

  protected mudarComissao(evento: Event) {
    this.comissaoPct.set(Number((evento.target as HTMLInputElement).value));
  }

  protected formatar(centavos: number): string {
    return formatarMoeda(centavos);
  }

  private proporcao(centavos: number): number {
    const total = this.resultado().faturamentoCentavos;
    return total > 0 ? Math.max(0, Math.min(100, (centavos / total) * 100)) : 0;
  }
}
