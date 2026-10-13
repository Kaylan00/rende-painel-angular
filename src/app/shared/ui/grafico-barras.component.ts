import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { animate, stagger } from 'motion';
import { formatarDiaMes } from '../../core/utils/datas';
import { formatarMoeda } from '../../core/utils/moeda';
import { CURVA_SUAVE, movimentoReduzido } from '../movimento/movimento';

export interface PontoGrafico {
  /** yyyy-MM-dd */
  data: string;
  valorCentavos: number;
}

const LARGURA = 560;
const ALTURA = 220;
const MARGEM_BASE = 30;
const MARGEM_TOPO = 26;

/**
 * Gráfico de barras em SVG puro, sem biblioteca. As barras são calculadas por um computed signal.
 * O último ponto (hoje) fica em verde-escuro, com o valor escrito em cima.
 * Ao aparecer, as barras crescem da base em sequência (motion), exceto com movimento reduzido.
 */
@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="grafico" [attr.viewBox]="'0 0 ' + largura + ' ' + altura" role="img" [attr.aria-label]="descricao()">
      <line class="base" x1="0" [attr.x2]="largura" [attr.y1]="altura - margemBase" [attr.y2]="altura - margemBase" />
      @for (barra of barras(); track barra.data; let ultima = $last) {
        <g>
          <title>{{ barra.dica }}</title>
          <rect class="barra" [class.barra--hoje]="ultima" [attr.x]="barra.x" [attr.y]="barra.y"
            [attr.width]="barra.largura" [attr.height]="barra.altura" rx="3" />
          @if (ultima) {
            <text class="valor" [attr.x]="barra.x + barra.largura / 2" [attr.y]="barra.y - 9" text-anchor="middle">{{ barra.valor }}</text>
          }
          <text class="rotulo" [attr.x]="barra.x + barra.largura / 2" [attr.y]="altura - 8" text-anchor="middle">{{ barra.rotulo }}</text>
        </g>
      }
    </svg>
  `,
  styles: `
    .grafico { width: 100%; height: auto; display: block; overflow: visible; }
    .base { stroke: var(--linha-forte); stroke-width: 1; }
    .barra {
      fill: var(--verde-200);
      transform-box: fill-box;
      transform-origin: bottom;
    }
    .barra--hoje { fill: var(--verde-900); }
    .rotulo { font-size: 13px; fill: var(--cor-texto-suave); font-variant-numeric: tabular-nums; }
    .valor { font-size: 13px; font-weight: 600; fill: var(--verde-950); font-variant-numeric: tabular-nums; }
  `,
})
export class GraficoBarrasComponent {
  pontos = input.required<PontoGrafico[]>();

  protected readonly largura = LARGURA;
  protected readonly altura = ALTURA;
  protected readonly margemBase = MARGEM_BASE;

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      if (movimentoReduzido()) return;
      const retangulos = el.querySelectorAll('rect.barra');
      if (retangulos.length === 0) return;
      animate(retangulos, { transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 0.9, ease: CURVA_SUAVE, delay: stagger(0.06) });
    });
  }

  protected barras = computed(() => {
    const pontos = this.pontos();
    const maximo = Math.max(...pontos.map((p) => p.valorCentavos), 1);
    const areaUtil = ALTURA - MARGEM_BASE - MARGEM_TOPO;
    const passo = LARGURA / Math.max(pontos.length, 1);
    const largura = Math.min(passo * 0.56, 48);

    return pontos.map((p, i) => {
      const altura = Math.max((p.valorCentavos / maximo) * areaUtil, p.valorCentavos > 0 ? 2 : 0);
      return {
        data: p.data,
        rotulo: formatarDiaMes(p.data),
        valor: formatarMoeda(p.valorCentavos),
        dica: `${formatarDiaMes(p.data)}: ${formatarMoeda(p.valorCentavos)}`,
        x: i * passo + (passo - largura) / 2,
        y: ALTURA - MARGEM_BASE - altura,
        largura,
        altura,
      };
    });
  });

  protected descricao = computed(
    () => 'Vendas por dia. ' + this.barras().map((b) => b.dica).join('; '),
  );
}
