import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { Recebivel } from '../../core/models/painel.model';
import { ROTULO_FORMA } from '../../core/models/pedido.model';
import { formatarDataBr } from '../../core/utils/datas';
import { comEstado, Estado } from '../../core/utils/estado-requisicao';
import { MoedaPipe } from '../../shared/pipes/moeda.pipe';
import { EstadoComponent } from '../../shared/ui/estado-vazio.component';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';

export interface GrupoRecebivel {
  data: string;
  itens: Recebivel[];
  liquidoCentavos: number;
}

/** Agrupa os recebíveis por data prevista (função pura, fácil de testar). */
export function agruparPorData(lista: Recebivel[]): GrupoRecebivel[] {
  const grupos = new Map<string, GrupoRecebivel>();
  for (const item of lista) {
    const grupo = grupos.get(item.dataPrevista) ?? { data: item.dataPrevista, itens: [], liquidoCentavos: 0 };
    grupo.itens.push(item);
    grupo.liquidoCentavos += item.liquidoCentavos;
    grupos.set(item.dataPrevista, grupo);
  }
  return [...grupos.values()].sort((a, b) => a.data.localeCompare(b.data));
}

@Component({
  selector: 'app-recebiveis',
  imports: [MoedaPipe, MetricCardComponent, EstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recebiveis.component.html',
  styleUrl: './recebiveis.component.scss',
})
export class RecebiveisComponent {
  private readonly painel = inject(PainelService);

  protected readonly rotuloForma = ROTULO_FORMA;
  protected readonly formatarData = formatarDataBr;

  private readonly recarregar$ = new BehaviorSubject<void>(undefined);

  protected readonly estado = toSignal(
    this.recarregar$.pipe(switchMap(() => this.painel.recebiveis().pipe(comEstado()))),
    { initialValue: { status: 'carregando' } as Estado<Recebivel[]> },
  );

  /** Lista (vazia enquanto carrega ou em erro). */
  private readonly lista = computed(() => {
    const e = this.estado();
    return e.status === 'ok' ? e.dados : [];
  });

  /** Computed signals: recalculam sozinhos quando `lista` muda, sem código extra. */
  protected readonly grupos = computed(() => agruparPorData(this.lista()));
  protected readonly totalLiquido = computed(() => this.lista().reduce((soma, r) => soma + r.liquidoCentavos, 0));
  protected readonly totalBruto = computed(() => this.lista().reduce((soma, r) => soma + r.brutoCentavos, 0));
  protected readonly totalTaxas = computed(() => this.totalBruto() - this.totalLiquido());
  protected readonly proximoDia = computed(() => this.grupos()[0] ?? null);

  protected recarregar() {
    this.recarregar$.next();
  }
}
