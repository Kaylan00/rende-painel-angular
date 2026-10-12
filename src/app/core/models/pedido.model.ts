import { aplicarBps } from '../utils/moeda';

export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro';

export const FORMAS_PAGAMENTO: FormaPagamento[] = ['pix', 'credito', 'debito', 'dinheiro'];

export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
};

/** Taxa de cada canal em basis points (1 bp = 0,01%). Pix 0,99% = 99 bps. */
export const TAXA_BPS: Record<FormaPagamento, number> = {
  pix: 99,
  credito: 399,
  debito: 189,
  dinheiro: 0,
};

/** Quantos dias depois da venda o dinheiro cai na conta. */
export const PRAZO_RECEBIMENTO_DIAS: Record<FormaPagamento, number> = {
  pix: 0,
  debito: 1,
  credito: 30,
  dinheiro: 0,
};

export type StatusPedido =
  | 'aguardando_pagamento'
  | 'recebido'
  | 'preparo'
  | 'pronto'
  | 'saiu'
  | 'entregue'
  | 'cancelado';

export interface Pedido {
  id: number;
  numero: number;
  cliente: string;
  itens: string;
  totalCentavos: number;
  formaPagamento: FormaPagamento;
  status: StatusPedido;
  /** Data ISO (ex.: 2026-10-12T19:30:00.000Z) */
  criadoEm: string;
}

export interface FiltroPedidos {
  status: StatusPedido | '';
  formaPagamento: FormaPagamento | '';
  /** yyyy-MM-dd */
  de: string;
  ate: string;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface ResumoFormaPagamento {
  forma: FormaPagamento;
  pedidos: number;
  brutoCentavos: number;
  taxaBps: number;
  taxaCentavos: number;
  liquidoCentavos: number;
}

/** Receita líquida de um valor: bruto menos a taxa do canal. */
export function calcularLiquido(brutoCentavos: number, forma: FormaPagamento) {
  const taxaCentavos = aplicarBps(brutoCentavos, TAXA_BPS[forma]);
  return { taxaCentavos, liquidoCentavos: brutoCentavos - taxaCentavos };
}
