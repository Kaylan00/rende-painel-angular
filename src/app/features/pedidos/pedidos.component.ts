import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { PedidosService } from '../../core/api/pedidos.service';
import { ROTULO_STATUS, TODOS_STATUS, proximosStatus } from '../../core/models/pedido-status';
import {
  FiltroPedidos,
  FORMAS_PAGAMENTO,
  FormaPagamento,
  Pagina,
  Pedido,
  ROTULO_FORMA,
  StatusPedido,
} from '../../core/models/pedido.model';
import { NotificacaoService } from '../../core/notificacao.service';
import { comEstado, Estado, mensagemDeErro } from '../../core/utils/estado-requisicao';
import { MoedaPipe } from '../../shared/pipes/moeda.pipe';
import { BadgeStatusComponent } from '../../shared/ui/badge-status.component';
import { BotaoComponent } from '../../shared/ui/botao.component';
import { EstadoComponent } from '../../shared/ui/estado-vazio.component';
import { PaginacaoComponent } from '../../shared/ui/paginacao.component';
import { Coluna, TabelaComponent } from '../../shared/ui/tabela.component';

const POR_PAGINA = 8;

const ROTULO_ACAO: Record<StatusPedido, string> = {
  aguardando_pagamento: 'Aguardar pagamento',
  recebido: 'Confirmar pagamento',
  preparo: 'Iniciar preparo',
  pronto: 'Marcar pronto',
  saiu: 'Saiu para entrega',
  entregue: 'Marcar entregue',
  cancelado: 'Cancelar',
};

@Component({
  selector: 'app-pedidos',
  imports: [
    ReactiveFormsModule, DatePipe, MoedaPipe, TabelaComponent, PaginacaoComponent,
    BadgeStatusComponent, BotaoComponent, EstadoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export class PedidosComponent {
  private readonly pedidosApi = inject(PedidosService);
  private readonly avisos = inject(NotificacaoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly listaStatus = TODOS_STATUS;
  protected readonly rotuloStatus = ROTULO_STATUS;
  protected readonly formas = FORMAS_PAGAMENTO;
  protected readonly rotuloForma = ROTULO_FORMA;
  protected readonly porPagina = POR_PAGINA;
  protected readonly proximosStatus = proximosStatus;

  protected readonly colunas: Coluna<Pedido>[] = [
    { chave: 'numero', titulo: 'Pedido' },
    { chave: 'cliente', titulo: 'Cliente' },
    { chave: 'formaPagamento', titulo: 'Pagamento' },
    { chave: 'totalCentavos', titulo: 'Total', alinhar: 'direita' },
    { chave: 'status', titulo: 'Status' },
    { chave: 'id', titulo: 'Ação' },
  ];

  protected readonly filtro = this.fb.nonNullable.group({
    status: '' as StatusPedido | '',
    formaPagamento: '' as FiltroPedidos['formaPagamento'],
    de: '',
    ate: '',
  });

  /** Página atual e botão "tentar de novo": BehaviorSubject guarda o último valor e já emite ao assinar. */
  private readonly pagina$ = new BehaviorSubject(1);
  private readonly recarregar$ = new BehaviorSubject<void>(undefined);
  protected readonly pagina = toSignal(this.pagina$, { initialValue: 1 });

  /** Valores do formulário, com debounce para não buscar a cada tecla/clique. */
  private readonly filtro$ = this.filtro.valueChanges.pipe(
    debounceTime(300),
    startWith(null), // a primeira busca não espera o debounce
    map(() => this.filtro.getRawValue()),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(() => {
      // filtro novo -> volta para a primeira página
      if (this.pagina$.value !== 1) this.pagina$.next(1);
    }),
  );

  /**
   * Pipeline principal: (filtro, página, recarregar) -> HTTP.
   * switchMap cancela a requisição anterior se o usuário mudar o filtro antes de ela terminar.
   * comEstado() usa catchError por dentro, então um erro HTTP não derruba o stream.
   * toSignal assina e cancela sozinho quando o componente é destruído.
   */
  protected readonly estado = toSignal(
    combineLatest([this.filtro$, this.pagina$, this.recarregar$]).pipe(
      switchMap(([filtro, pagina]) => this.pedidosApi.buscar(filtro, pagina, POR_PAGINA).pipe(comEstado())),
    ),
    { initialValue: { status: 'carregando' } as Estado<Pagina<Pedido>> },
  );

  protected readonly atualizando = signal<number | null>(null);

  protected mudarPagina(pagina: number) {
    this.pagina$.next(pagina);
  }

  protected recarregar() {
    this.recarregar$.next();
  }

  protected limparFiltros() {
    this.filtro.reset();
  }

  protected avancar(pedido: Pedido, novo: StatusPedido) {
    this.atualizando.set(pedido.id);
    this.pedidosApi
      .atualizarStatus(pedido.id, novo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avisos.sucesso(`Pedido #${pedido.numero} agora está "${ROTULO_STATUS[novo]}".`);
          this.atualizando.set(null);
          this.recarregar();
        },
        error: (erro: unknown) => {
          this.atualizando.set(null);
          this.avisos.erro(mensagemDeErro(erro));
        },
      });
  }

  protected nomeForma(forma: FormaPagamento): string {
    return ROTULO_FORMA[forma];
  }

  /** Texto do botão de cada transição de status. */
  protected rotuloAcao(status: StatusPedido): string {
    return ROTULO_ACAO[status];
  }
}
