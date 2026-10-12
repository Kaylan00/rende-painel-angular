import { StatusPedido } from './pedido.model';

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  recebido: 'Recebido',
  preparo: 'Em preparo',
  pronto: 'Pronto',
  saiu: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const TODOS_STATUS = Object.keys(ROTULO_STATUS) as StatusPedido[];

/**
 * Máquina de estados do pedido: de cada status só dá para ir para alguns outros.
 * "entregue" e "cancelado" são finais.
 */
const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  aguardando_pagamento: ['recebido', 'cancelado'],
  recebido: ['preparo', 'cancelado'],
  preparo: ['pronto', 'cancelado'],
  pronto: ['saiu', 'entregue'], // "entregue" direto = retirada no balcão
  saiu: ['entregue'],
  entregue: [],
  cancelado: [],
};

export function proximosStatus(atual: StatusPedido): StatusPedido[] {
  return TRANSICOES[atual];
}

export function podeTransicionar(de: StatusPedido, para: StatusPedido): boolean {
  return TRANSICOES[de].includes(para);
}

/** Pedido contado como venda: já foi pago e não foi cancelado. */
export function contaComoVenda(status: StatusPedido): boolean {
  return status !== 'aguardando_pagamento' && status !== 'cancelado';
}
