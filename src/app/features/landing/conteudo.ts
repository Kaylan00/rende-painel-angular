/** Textos e dados fixos da landing (separados do template para ficar fácil de revisar). */

/**
 * WhatsApp do comercial. Sem número definido, o link abre o WhatsApp com a mensagem pronta
 * para o lojista escolher o contato. Para usar um número: 'https://wa.me/55DDDNUMERO?text=...'.
 */
const MENSAGEM_WHATSAPP = 'Oi! Vi o site do Rende e quero entender como fica para a minha loja.';
export const LINK_WHATSAPP = `https://wa.me/?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;

export interface Passo {
  numero: string;
  titulo: string;
  texto: string;
  detalhe: string;
}

export const PASSOS: Passo[] = [
  {
    numero: '01',
    titulo: 'O cliente abre o cardápio',
    texto: 'Aponta a câmera para o QR Code na mesa, no balcão ou no saquinho da entrega. Abre no navegador, sem baixar aplicativo.',
    detalhe: 'Também por link no Instagram e no WhatsApp',
  },
  {
    numero: '02',
    titulo: 'O pedido cai no seu painel',
    texto: 'Com itens, observações e endereço. A cozinha avança o status, e o cliente acompanha do celular.',
    detalhe: 'Recebido, preparo, pronto, saiu, entregue',
  },
  {
    numero: '03',
    titulo: 'O Pix vai para a conta da loja',
    texto: 'O cliente paga pelo Pix da sua loja. O dinheiro não passa pelo Rende e não espera repasse de ninguém.',
    detalhe: 'Cartão por link de pagamento, se preferir',
  },
];

export interface ModeloLoja {
  nome: string;
  tipo: string;
  cidade: string;
  foto: string;
  alt: string;
  /** cor de destaque da loja (cada loja tem a sua) */
  cor: string;
  itens: { nome: string; preco: string }[];
}

export const MODELOS: ModeloLoja[] = [
  {
    nome: 'Bocca Burger',
    tipo: 'Hamburgueria',
    cidade: 'Cachoeiro',
    foto: 'assets/fotos/hamburgueria.jpg',
    alt: 'Hambúrguer duplo com queijo, alface e tomate',
    cor: '#0f3d2e',
    itens: [
      { nome: 'Bocca Duplo', preco: 'R$ 41,90' },
      { nome: 'Smash Clássico', preco: 'R$ 27,90' },
    ],
  },
  {
    nome: 'Forno da Praça',
    tipo: 'Pizzaria',
    cidade: 'Vila Velha',
    foto: 'assets/fotos/pizzaria.jpg',
    alt: 'Pizza assada inteira, vista de cima',
    cor: '#8a2f1d',
    itens: [
      { nome: 'Margherita grande', preco: 'R$ 62,00' },
      { nome: 'Calabresa com cebola', preco: 'R$ 58,00' },
    ],
  },
  {
    nome: 'Açaí do Porto',
    tipo: 'Açaiteria',
    cidade: 'Guarapari',
    foto: 'assets/fotos/acaiteria.jpg',
    alt: 'Duas tigelas de açaí com banana, morango, mirtilo e granola',
    cor: '#4a2747',
    itens: [
      { nome: 'Tigela 500 ml', preco: 'R$ 24,00' },
      { nome: 'Copo 300 ml', preco: 'R$ 16,00' },
    ],
  },
  {
    nome: 'Padaria Dona Lia',
    tipo: 'Padaria e café',
    cidade: 'Colatina',
    foto: 'assets/fotos/padaria.jpg',
    alt: 'Croissants dourados sobre uma pedra escura',
    cor: '#6b4423',
    itens: [
      { nome: 'Croissant de manteiga', preco: 'R$ 9,50' },
      { nome: 'Café coado 200 ml', preco: 'R$ 6,00' },
    ],
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

/** Créditos das fotos (Unsplash). */
export const CREDITOS_FOTOS: { autor: string; foto: string }[] = [
  { autor: 'Jonathan Borba', foto: 'hambúrguer do topo' },
  { autor: 'Pinar Kucuk', foto: 'pizza na mesa' },
  { autor: 'Jason Leung', foto: 'salão do restaurante' },
  { autor: 'Nick Hillier', foto: 'restaurante cheio' },
  { autor: 'amirali mirhashemian', foto: 'hamburgueria' },
  { autor: 'Aurélien Lemasson-Théobald', foto: 'pizzaria' },
  { autor: 'Vicky Ng', foto: 'açaiteria' },
  { autor: 'Mae Mu', foto: 'padaria' },
];
