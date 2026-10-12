import { FormaPagamento, Pedido, StatusPedido } from '../models/pedido.model';

export const LOJISTA_MOCK = 'Bocca Burger';

const CLIENTES = [
  'Marina Alves', 'João Pedro Souza', 'Carla Nunes', 'Rafael Mendes', 'Luciana Prado',
  'Thiago Ribeiro', 'Bianca Moraes', 'Felipe Castro', 'Amanda Lima', 'Diego Ferreira',
  'Patrícia Gomes', 'Gustavo Rocha',
];

const CARDAPIO: { nome: string; centavos: number }[] = [
  { nome: 'X-Bacon', centavos: 3290 },
  { nome: 'Bocca Duplo', centavos: 4190 },
  { nome: 'Smash Clássico', centavos: 2790 },
  { nome: 'Batata média', centavos: 1890 },
  { nome: 'Onion rings', centavos: 2190 },
  { nome: 'Milkshake', centavos: 2490 },
  { nome: 'Refrigerante lata', centavos: 750 },
];

/** Gerador pseudoaleatório com semente: os dados do mock são sempre os mesmos. */
function criarAleatorio(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

function sortearForma(r: number): FormaPagamento {
  if (r < 0.45) return 'pix';
  if (r < 0.75) return 'credito';
  if (r < 0.92) return 'debito';
  return 'dinheiro';
}

function sortearStatus(diasAtras: number, r: number): StatusPedido {
  if (diasAtras > 0) return r < 0.07 ? 'cancelado' : 'entregue';
  // pedidos de hoje: espalhados pela máquina de estados
  const hoje: StatusPedido[] = ['aguardando_pagamento', 'recebido', 'preparo', 'pronto', 'saiu', 'entregue', 'entregue', 'entregue'];
  return hoje[Math.floor(r * hoje.length)];
}

/** Cria ~70 pedidos espalhados pelos últimos 14 dias, do mais antigo para o mais novo. */
export function gerarPedidos(agora: Date = new Date()): Pedido[] {
  const aleatorio = criarAleatorio(42);
  const pedidos: Pedido[] = [];
  let numero = 1000;

  for (let diasAtras = 13; diasAtras >= 0; diasAtras--) {
    const quantidade = diasAtras === 0 ? 9 : 4 + Math.floor(aleatorio() * 3);
    for (let i = 0; i < quantidade; i++) {
      const itens = [CARDAPIO[Math.floor(aleatorio() * CARDAPIO.length)]];
      if (aleatorio() < 0.6) itens.push(CARDAPIO[Math.floor(aleatorio() * CARDAPIO.length)]);

      const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - diasAtras, 12, 0);
      // pedidos de hoje nunca ficam no futuro
      const horaMax = diasAtras === 0 ? Math.max(agora.getHours(), 11) : 23;
      data.setHours(11 + Math.floor(aleatorio() * (horaMax - 10)), Math.floor(aleatorio() * 60));

      pedidos.push({
        id: ++numero,
        numero,
        cliente: CLIENTES[Math.floor(aleatorio() * CLIENTES.length)],
        itens: itens.map((x) => x.nome).join(' + '),
        totalCentavos: itens.reduce((soma, x) => soma + x.centavos, 0) + 600, // + taxa de entrega
        formaPagamento: sortearForma(aleatorio()),
        status: sortearStatus(diasAtras, aleatorio()),
        criadoEm: data.toISOString(),
      });
    }
  }
  return pedidos;
}
