import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROTULO_STATUS } from '../../core/models/pedido-status';
import { StatusPedido } from '../../core/models/pedido.model';

type Tom = 'neutro' | 'aviso' | 'info' | 'sucesso' | 'perigo';

const TOM_POR_STATUS: Record<StatusPedido, Tom> = {
  aguardando_pagamento: 'aviso',
  recebido: 'info',
  preparo: 'info',
  pronto: 'info',
  saiu: 'info',
  entregue: 'sucesso',
  cancelado: 'perigo',
};

/** Etiqueta colorida do status do pedido. O texto sempre aparece: cor nunca é a única informação. */
@Component({
  selector: 'app-badge-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge--' + tom()">{{ rotulo() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 0.125rem 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
      border-radius: 999px;
    }
    .badge--aviso { color: var(--cor-aviso); background: var(--cor-aviso-fundo); }
    .badge--info { color: var(--cor-info); background: var(--cor-info-fundo); }
    .badge--sucesso { color: var(--cor-sucesso); background: var(--cor-sucesso-fundo); }
    .badge--perigo { color: var(--cor-perigo); background: var(--cor-perigo-fundo); }
  `,
})
export class BadgeStatusComponent {
  status = input.required<StatusPedido>();
  protected rotulo = computed(() => ROTULO_STATUS[this.status()]);
  protected tom = computed(() => TOM_POR_STATUS[this.status()]);
}
