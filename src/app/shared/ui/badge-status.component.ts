import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROTULO_STATUS } from '../../core/models/pedido-status';
import { StatusPedido } from '../../core/models/pedido.model';

type Tom = 'aviso' | 'andamento' | 'sucesso' | 'perigo';

const TOM_POR_STATUS: Record<StatusPedido, Tom> = {
  aguardando_pagamento: 'aviso',
  recebido: 'andamento',
  preparo: 'andamento',
  pronto: 'andamento',
  saiu: 'andamento',
  entregue: 'sucesso',
  cancelado: 'perigo',
};

/**
 * Status do pedido: um ponto colorido + o nome. O texto sempre aparece
 * (cor nunca é a única informação) e o texto tem contraste AA.
 */
@Component({
  selector: 'app-badge-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'status status--' + tom()"><span class="ponto" aria-hidden="true"></span>{{ rotulo() }}</span>`,
  styles: `
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .ponto {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
    }
    .status--aviso { color: var(--cor-aviso); }
    .status--andamento { color: var(--cor-info); }
    .status--sucesso { color: var(--cor-sucesso); }
    .status--perigo { color: var(--cor-perigo); }
  `,
})
export class BadgeStatusComponent {
  status = input.required<StatusPedido>();
  protected rotulo = computed(() => ROTULO_STATUS[this.status()]);
  protected tom = computed(() => TOM_POR_STATUS[this.status()]);
}
