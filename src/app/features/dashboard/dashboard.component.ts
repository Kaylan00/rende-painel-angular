import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { Dashboard } from '../../core/models/painel.model';
import { ROTULO_FORMA, ResumoFormaPagamento } from '../../core/models/pedido.model';
import { comEstado } from '../../core/utils/estado-requisicao';
import { formatarBps, formatarMoeda } from '../../core/utils/moeda';
import { MoedaPipe } from '../../shared/pipes/moeda.pipe';
import { BadgeStatusComponent } from '../../shared/ui/badge-status.component';
import { EstadoComponent } from '../../shared/ui/estado-vazio.component';
import { GraficoBarrasComponent } from '../../shared/ui/grafico-barras.component';
import { ContadorDirective } from '../../shared/movimento/contador.directive';
import { RevelarDirective } from '../../shared/movimento/revelar.directive';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    AsyncPipe, DatePipe, RouterLink, MoedaPipe, MetricCardComponent, GraficoBarrasComponent, BadgeStatusComponent,
    EstadoComponent, ContadorDirective, RevelarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly painel = inject(PainelService);

  protected readonly rotuloForma = ROTULO_FORMA;
  protected readonly formatarBps = formatarBps;
  protected readonly hoje = new Date();

  /** Gatilho para recarregar: cada .next() dispara uma nova busca (switchMap cancela a anterior). */
  private readonly recarregar$ = new BehaviorSubject<void>(undefined);

  /** O template assina com `| async`, que também cancela a assinatura sozinho ao destruir o componente. */
  protected readonly estado$ = this.recarregar$.pipe(switchMap(() => this.painel.dashboard().pipe(comEstado())));

  protected recarregar() {
    this.recarregar$.next();
  }

  protected totalLiquido(dados: Dashboard): number {
    return dados.porFormaPagamento.reduce((soma, f) => soma + f.liquidoCentavos, 0);
  }

  protected pontosGrafico(dados: Dashboard) {
    return dados.vendasUltimosDias.map((d) => ({ data: d.data, valorCentavos: d.totalCentavos }));
  }

  protected legendaForma(f: ResumoFormaPagamento): string {
    if (f.taxaBps === 0) return `sem taxa · ${formatarMoeda(f.brutoCentavos)} recebidos`;
    return `taxa ${formatarBps(f.taxaBps)} · ${formatarMoeda(f.taxaCentavos)} sobre ${formatarMoeda(f.brutoCentavos)}`;
  }
}
