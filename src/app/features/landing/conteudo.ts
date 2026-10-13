/** Textos e dados fixos da landing (separados do template para ficar fácil de revisar). */

/**
 * WhatsApp do comercial. Sem número definido, o link abre o WhatsApp com a mensagem pronta
 * para o lojista escolher o contato. Para usar um número: 'https://wa.me/55DDDNUMERO?text=...'.
 */
const MENSAGEM_WHATSAPP = 'Oi! Vi o site do Rende e quero entender como fica para a minha loja.';
export const LINK_WHATSAPP = `https://wa.me/?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;

export interface ItemCardapio {
  nome: string;
  descricao: string;
  preco: string;
}

export interface ModeloLoja {
  nome: string;
  tipo: string;
  cidade: string;
  horario: string;
  foto: string;
  alt: string;
  /** cor de destaque da loja (cada loja tem a sua) */
  cor: string;
  /** cor do texto sobre a cor da loja */
  corTexto: string;
  categorias: string[];
  itens: ItemCardapio[];
  sacola: string;
}

export const MODELOS: ModeloLoja[] = [
  {
    nome: 'Bocca Burger',
    tipo: 'Hamburgueria',
    cidade: 'Cachoeiro',
    horario: 'aberto até 23h',
    foto: 'assets/fotos/hamburgueria.jpg',
    alt: 'Hambúrguer duplo com queijo, alface e tomate',
    cor: '#c8642f',
    corTexto: '#fff8ee',
    categorias: ['Burgers', 'Porções', 'Bebidas'],
    itens: [
      { nome: 'Bocca Duplo', descricao: 'Dois smash, cheddar, cebola na chapa', preco: 'R$ 41,90' },
      { nome: 'Smash Clássico', descricao: 'Pão brioche, carne 90 g, queijo', preco: 'R$ 27,90' },
      { nome: 'Batata média', descricao: 'Com páprica e maionese da casa', preco: 'R$ 16,00' },
    ],
    sacola: 'R$ 57,90',
  },
  {
    nome: 'Forno da Praça',
    tipo: 'Pizzaria',
    cidade: 'Vila Velha',
    horario: 'aberto até 0h',
    foto: 'assets/fotos/pizzaria.jpg',
    alt: 'Pizza assada inteira, vista de cima',
    cor: '#9e2b25',
    corTexto: '#fff4ec',
    categorias: ['Pizzas', 'Calzones', 'Bebidas'],
    itens: [
      { nome: 'Margherita grande', descricao: 'Tomate pelado, muçarela, manjericão', preco: 'R$ 62,00' },
      { nome: 'Calabresa com cebola', descricao: 'Calabresa artesanal e cebola roxa', preco: 'R$ 58,00' },
      { nome: 'Quatro queijos', descricao: 'Muçarela, provolone, gorgonzola, parmesão', preco: 'R$ 66,00' },
    ],
    sacola: 'R$ 62,00',
  },
  {
    nome: 'Açaí do Porto',
    tipo: 'Açaiteria',
    cidade: 'Guarapari',
    horario: 'aberto até 22h',
    foto: 'assets/fotos/acaiteria.jpg',
    alt: 'Duas tigelas de açaí com banana, morango, mirtilo e granola',
    cor: '#5b2a5c',
    corTexto: '#fbf0ff',
    categorias: ['Tigelas', 'Copos', 'Adicionais'],
    itens: [
      { nome: 'Tigela 500 ml', descricao: 'Banana, morango e granola', preco: 'R$ 24,00' },
      { nome: 'Copo 300 ml', descricao: 'Leite em pó e paçoca', preco: 'R$ 16,00' },
      { nome: 'Tigela da casa', descricao: 'Cupuaçu, kiwi e mel', preco: 'R$ 28,00' },
    ],
    sacola: 'R$ 40,00',
  },
  {
    nome: 'Padaria Dona Lia',
    tipo: 'Padaria e café',
    cidade: 'Colatina',
    horario: 'aberto até 20h',
    foto: 'assets/fotos/padaria.jpg',
    alt: 'Croissants dourados sobre uma pedra escura',
    cor: '#e0a948',
    corTexto: '#2a1d0c',
    categorias: ['Pães', 'Doces', 'Café'],
    itens: [
      { nome: 'Croissant de manteiga', descricao: 'Folhado, saído do forno às 7h', preco: 'R$ 9,50' },
      { nome: 'Pão de queijo (6 un.)', descricao: 'Com queijo canastra', preco: 'R$ 12,00' },
      { nome: 'Café coado 200 ml', descricao: 'Grão do Caparaó', preco: 'R$ 6,00' },
    ],
    sacola: 'R$ 15,50',
  },
];

export const INCLUSO_NO_PLANO: string[] = [
  'Cardápio digital com QR Code e link próprio',
  'Pedidos ilimitados, sem taxa por pedido',
  'Painel com pedidos, recebíveis e cobranças',
  'Pix direto na conta da loja',
  'Cobrança por link para cartão de crédito e débito',
  'Ajuda para montar o cardápio na primeira semana',
  'Suporte pelo WhatsApp em horário comercial',
];

export interface Pergunta {
  pergunta: string;
  resposta: string;
}

export const PERGUNTAS: Pergunta[] = [
  {
    pergunta: 'Preciso sair do app de delivery?',
    resposta:
      'Não. Muita loja usa os dois: o app para ser encontrada por quem ainda não conhece, e o Rende para o cliente que já pede sempre e pode pedir direto, sem comissão.',
  },
  {
    pergunta: 'O dinheiro do Pix passa pelo Rende?',
    resposta:
      'Não. O Pix é feito para a chave da sua loja e cai na sua conta na hora. O Rende só registra o pedido e mostra no painel.',
  },
  {
    pergunta: 'E quem quer pagar com cartão?',
    resposta:
      'Você gera um link de pagamento pelo painel e manda para o cliente. A taxa do cartão é da operadora, e o painel mostra quanto cai de verdade.',
  },
  {
    pergunta: 'Tem fidelidade ou taxa de instalação?',
    resposta: 'Não. Você paga a mensalidade mês a mês e pode cancelar quando quiser, sem multa.',
  },
  {
    pergunta: 'Funciona para entrega e para retirada?',
    resposta:
      'Sim. Você define a taxa de entrega por bairro, o pedido mínimo e se a loja aceita retirada no balcão ou consumo na mesa.',
  },
];
