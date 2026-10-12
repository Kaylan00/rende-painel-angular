import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarDiaMes } from '../../core/utils/datas';
import { formatarMoeda } from '../../core/utils/moeda';

export interface PontoGrafico {
  /** yyyy-MM-dd */
  data: string;
  valorCentavos: number;
}

const LARGURA = 560;
const ALTURA = 200;
const MARGEM_BASE = 28;

/** Gráfico de barras em SVG puro, sem biblioteca. As barras são calculadas por um computed signal. */
@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="grafico" [attr.viewBox]="'0 0 ' + largura + ' ' + altura" role="img" [attr.aria-label]="descricao()">
      @for (barra of barras(); track barra.data) {
        <g>
          <title>{{ barra.dica }}</title>
          <rect class="barra" [attr.x]="barra.x" [attr.y]="barra.y" [attr.width]="barra.largura" [attr.height]="barra.altura" rx="4" />
          <text class="rotulo" [attr.x]="barra.x + barra.largura / 2" [attr.y]="altura - 8" text-anchor="middle">{{ barra.rotulo }}</text>
        </g>
      }
    </svg>
  `,
  styles: `
    .grafico { width: 100%; height: auto; display: block; }
    .barra { fill: var(--cor-primaria); }
    .rotulo { font-size: 13px; fill: var(--cor-texto-suave); }
  `,
})
export class GraficoBarrasComponent {
  pontos = input.required<PontoGrafico[]>();

  protected readonly largura = LARGURA;
  protected readonly altura = ALTURA;

  protected barras = computed(() => {
    const pontos = this.pontos();
    const maximo = Math.max(...pontos.map((p) => p.valorCentavos), 1);
    const areaUtil = ALTURA - MARGEM_BASE - 8;
    const passo = LARGURA / Math.max(pontos.length, 1);
    const largura = passo * 0.6;

    return pontos.map((p, i) => {
      const altura = Math.max((p.valorCentavos / maximo) * areaUtil, p.valorCentavos > 0 ? 2 : 0);
      return {
        data: p.data,
        rotulo: formatarDiaMes(p.data),
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
