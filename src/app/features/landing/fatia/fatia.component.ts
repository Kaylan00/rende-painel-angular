import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { formatarMoeda } from '../../../core/utils/moeda';
import { ContadorDirective } from '../../../shared/movimento/contador.directive';
import { movimentoReduzido } from '../../../shared/movimento/movimento';
import { MENSALIDADE_RENDE_CENTAVOS } from '../comparativo';
import { prepararGsap } from '../movimento/rolagem.service';
import {
  calcularFatia,
  COMISSAO_MAX_PCT,
  COMISSAO_MIN_PCT,
  COMISSAO_PADRAO_PCT,
  FATURAMENTO_MAX_REAIS,
  FATURAMENTO_MIN_REAIS,
  FATURAMENTO_PADRAO_REAIS,
} from './fatia';

/**
 * "A fatia do app": a pizza é o faturamento do mês e a fatia que voa é a comissão.
 * Dois sliders escrevem em signals; a fatia (ângulo), o tamanho da pizza e os valores
 * são `computed`. O botão "Com o Rende" devolve a fatia para a pizza.
 */
@Component({
  selector: 'app-fatia',
  imports: [ContadorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fatia.component.html',
  styleUrl: './fatia.component.scss',
})
export class FatiaComponent {
  protected readonly faturamentoMin = FATURAMENTO_MIN_REAIS;
  protected readonly faturamentoMax = FATURAMENTO_MAX_REAIS;
  protected readonly comissaoMin = COMISSAO_MIN_PCT;
  protected readonly comissaoMax = COMISSAO_MAX_PCT;
  protected readonly mensalidade = formatarMoeda(MENSALIDADE_RENDE_CENTAVOS);

  readonly faturamentoReais = signal(FATURAMENTO_PADRAO_REAIS);
  readonly comissaoPct = signal(COMISSAO_PADRAO_PCT);
  /** true = cenário com o Rende (a fatia volta para a pizza). */
  readonly comRende = signal(false);
  /** A fatia só sai voando quando a seção aparece (sem movimento, já começa fora). */
  protected readonly entrou = signal(true);

  readonly fatia = computed(() => calcularFatia(this.faturamentoReais(), this.comissaoPct()));
  /** A fatia fica fora da pizza enquanto o cenário é o do app. */
  protected readonly fatiaFora = computed(() => this.entrou() && !this.comRende());
  protected readonly faturamentoTexto = computed(() => formatarMoeda(this.faturamentoReais() * 100));

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (movimentoReduzido()) return;
      prepararGsap();
      this.entrou.set(false);
      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        once: true,
        onEnter: () => this.entrou.set(true),
      });
      destroyRef.onDestroy(() => gatilho.kill());
    });
  }

  protected mudarFaturamento(evento: Event) {
    this.faturamentoReais.set(Number((evento.target as HTMLInputElement).value));
  }

  protected mudarComissao(evento: Event) {
    this.comissaoPct.set(Number((evento.target as HTMLInputElement).value));
  }

  protected alternar() {
    this.entrou.set(true);
    this.comRende.update((v) => !v);
  }

  protected formatar(centavos: number): string {
    return formatarMoeda(centavos);
  }
}
