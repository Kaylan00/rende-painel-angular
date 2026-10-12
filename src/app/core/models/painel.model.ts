import { FormaPagamento, Pedido, ResumoFormaPagamento } from './pedido.model';

export interface Recebivel {
  id: string;
  /** yyyy-MM-dd */
  dataPrevista: string;
  formaPagamento: FormaPagamento;
  pedidos: number;
  brutoCentavos: number;
  liquidoCentavos: number;
}

export interface VendaDia {
  /** yyyy-MM-dd */
  data: string;
  totalCentavos: number;
}

export interface Dashboard {
  vendasHojeCentavos: number;
  pedidosHoje: number;
  ticketMedioCentavos: number;
  aReceberCentavos: number;
  vendasUltimosDias: VendaDia[];
  porFormaPagamento: ResumoFormaPagamento[];
  ultimosPedidos: Pedido[];
}

export type TipoCobranca = 'pix' | 'link';

export interface NovaCobranca {
  tipo: TipoCobranca;
  descricao: string;
  valorCentavos: number;
  clienteNome: string;
  clienteDocumento: string;
  validadeHoras: number;
}

export interface Cobranca extends NovaCobranca {
  id: string;
  codigo: string;
  url: string;
  criadaEm: string;
}

export interface Sessao {
  token: string;
  lojista: string;
}
