import { Dashboard, Recebivel, VendaDia } from '../models/painel.model';
import { contaComoVenda } from '../models/pedido-status';
import {
  calcularLiquido,
  FORMAS_PAGAMENTO,
  Pedido,
  PRAZO_RECEBIMENTO_DIAS,
  ResumoFormaPagamento,
  TAXA_BPS,
} from '../models/pedido.model';
import { isoParaDataLocal, paraDataLocal, somarDias } from '../utils/datas';

/**
 * Cálculos que o back-end de verdade faria. Ficam como funções puras
 * (sem Angular) para serem fáceis de testar.
 */

export function resumirPorForma(pedidos: Pedido[]): ResumoFormaPagamento[] {
  return FORMAS_PAGAMENTO.map((forma) => {
    const vendas = pedidos.filter((p) => p.formaPagamento === forma && contaComoVenda(p.status));
    const brutoCentavos = vendas.reduce((soma, p) => soma + p.totalCentavos, 0);
    // calcula a taxa por pedido: arredondar cada venda é como a operadora cobra
    const taxaCentavos = vendas.reduce((soma, p) => soma + calcularLiquido(p.totalCentavos, forma).taxaCentavos, 0);
    return {
      forma,
      pedidos: vendas.length,
      brutoCentavos,
      taxaBps: TAXA_BPS[forma],
      taxaCentavos,
      liquidoCentavos: brutoCentavos - taxaCentavos,
    };
  });
}

export function montarRecebiveis(pedidos: Pedido[], hoje: string): Recebivel[] {
  const grupos = new Map<string, Recebivel>();

  for (const pedido of pedidos.filter((p) => contaComoVenda(p.status))) {
    const prazo = PRAZO_RECEBIMENTO_DIAS[pedido.formaPagamento];
    const dataPrevista = somarDias(isoParaDataLocal(pedido.criadoEm), prazo);
    if (prazo === 0 || dataPrevista <= hoje) continue; // já caiu na conta

    const chave = `${dataPrevista}-${pedido.formaPagamento}`;
    const { liquidoCentavos } = calcularLiquido(pedido.totalCentavos, pedido.formaPagamento);
    const atual = grupos.get(chave) ?? {
      id: chave,
      dataPrevista,
      formaPagamento: pedido.formaPagamento,
      pedidos: 0,
      brutoCentavos: 0,
      liquidoCentavos: 0,
    };
    atual.pedidos += 1;
    atual.brutoCentavos += pedido.totalCentavos;
    atual.liquidoCentavos += liquidoCentavos;
    grupos.set(chave, atual);
  }
  return [...grupos.values()].sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
}

export function montarDashboard(pedidos: Pedido[], agora: Date = new Date()): Dashboard {
  const hoje = paraDataLocal(agora);
  const vendas = pedidos.filter((p) => contaComoVenda(p.status));
  const vendasHoje = vendas.filter((p) => isoParaDataLocal(p.criadoEm) === hoje);
  const vendasHojeCentavos = vendasHoje.reduce((soma, p) => soma + p.totalCentavos, 0);

  const vendasUltimosDias: VendaDia[] = [];
  for (let i = 6; i >= 0; i--) {
    const data = somarDias(hoje, -i);
    const totalCentavos = vendas
      .filter((p) => isoParaDataLocal(p.criadoEm) === data)
      .reduce((soma, p) => soma + p.totalCentavos, 0);
    vendasUltimosDias.push({ data, totalCentavos });
  }

  return {
    vendasHojeCentavos,
    pedidosHoje: vendasHoje.length,
    // divisão inteira: ticket médio também é em centavos
    ticketMedioCentavos: vendasHoje.length ? Math.round(vendasHojeCentavos / vendasHoje.length) : 0,
    aReceberCentavos: montarRecebiveis(pedidos, hoje).reduce((soma, r) => soma + r.liquidoCentavos, 0),
    vendasUltimosDias,
    porFormaPagamento: resumirPorForma(vendas.filter((p) => isoParaDataLocal(p.criadoEm) >= vendasUltimosDias[0].data)),
    ultimosPedidos: [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5),
  };
}
