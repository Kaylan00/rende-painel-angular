/**
 * As 6 camadas do hambúrguer do palco.
 *
 * Medidas em "L" (a largura do hambúrguer montado):
 * - `largura` e `topo`: onde a camada fica quando o hambúrguer está montado;
 * - `pc` e `cel`: pose "explodida" do topo da página (deslocamento x/y em L, giro em graus, escala).
 * Assim o mesmo número serve para o CSS (versão parada) e para o GSAP (versão com rolagem).
 */
export interface Pose {
  x: number;
  y: number;
  giro: number;
  escala: number;
}

export interface Camada {
  id: 'pao-baixo' | 'carne' | 'queijo' | 'tomate' | 'alface' | 'pao-cima';
  src: string;
  /** proporção altura/largura da imagem (evita pulo de layout) */
  proporcao: number;
  largura: number;
  topo: number;
  /** no topo da página: true = passa na frente do nome RENDE */
  naFrente: boolean;
  /** quanto a camada responde ao mouse (as da frente mexem mais) */
  profundidade: number;
  /** balanço contínuo, em graus */
  balanco: number;
  pc: Pose;
  cel: Pose;
  /** enquanto espera a vez de descer: centro da camada, em L, a partir do centro do hambúrguer */
  espera: { x: number; y: number; giro: number };
  esperaCel: { x: number; y: number; giro: number };
}

/** Centro vertical da camada no hambúrguer montado, em L, a partir do centro do hambúrguer. */
export function centroMontado(c: Camada): number {
  return c.topo + (c.proporcao * c.largura) / 2 - 0.51;
}

/** De baixo para cima: é a ordem em que elas assentam ao rolar. */
export const CAMADAS: Camada[] = [
  {
    id: 'pao-baixo',
    src: 'assets/hamburguer/pao-baixo.webp',
    proporcao: 0.398,
    largura: 0.98,
    topo: 0.62,
    naFrente: false,
    profundidade: 0.5,
    balanco: 3,
    pc: { x: 0.8, y: 0.2, giro: -9, escala: 0.82 },
    cel: { x: 0.4, y: 0.32, giro: -8, escala: 0.8 },
    espera: { x: 0.1, y: 0.4, giro: 4 },
    esperaCel: { x: 0.75, y: 0.3, giro: 6 },
  },
  {
    id: 'carne',
    src: 'assets/hamburguer/carne.webp',
    proporcao: 0.439,
    largura: 0.96,
    topo: 0.47,
    naFrente: true,
    profundidade: 1.25,
    balanco: -4,
    pc: { x: -0.05, y: 0.38, giro: 6, escala: 1.05 },
    cel: { x: -0.28, y: 0.42, giro: 7, escala: 1 },
    espera: { x: -0.62, y: 0.12, giro: 8 },
    esperaCel: { x: -0.8, y: 0.25, giro: 8 },
  },
  {
    id: 'queijo',
    src: 'assets/hamburguer/queijo.webp',
    proporcao: 0.415,
    largura: 1,
    topo: 0.4,
    naFrente: false,
    profundidade: 0.7,
    balanco: 5,
    pc: { x: 1.12, y: -0.02, giro: 12, escala: 0.86 },
    cel: { x: 0.38, y: 0, giro: 10, escala: 0.82 },
    espera: { x: 0.18, y: -0.6, giro: 10 },
    esperaCel: { x: 0.8, y: -0.1, giro: 10 },
  },
  {
    id: 'tomate',
    src: 'assets/hamburguer/tomate.webp',
    proporcao: 0.396,
    largura: 0.9,
    topo: 0.33,
    naFrente: true,
    profundidade: 1.1,
    balanco: -6,
    pc: { x: -1.12, y: 0.02, giro: -14, escala: 0.9 },
    cel: { x: -0.38, y: -0.1, giro: -12, escala: 0.86 },
    espera: { x: -0.6, y: -0.3, giro: -12 },
    esperaCel: { x: -0.8, y: -0.35, giro: -10 },
  },
  {
    id: 'alface',
    src: 'assets/hamburguer/alface.webp',
    proporcao: 0.388,
    largura: 1.04,
    topo: 0.25,
    naFrente: false,
    profundidade: 0.45,
    balanco: 4,
    pc: { x: 0.86, y: -0.54, giro: 9, escala: 0.8 },
    cel: { x: 0.3, y: -0.55, giro: 8, escala: 0.8 },
    espera: { x: -0.1, y: -0.74, giro: 8 },
    esperaCel: { x: 0.75, y: -0.45, giro: 8 },
  },
  {
    id: 'pao-cima',
    src: 'assets/hamburguer/pao-cima.webp',
    proporcao: 0.488,
    largura: 1,
    topo: 0,
    naFrente: true,
    profundidade: 1.4,
    balanco: -3,
    pc: { x: -0.72, y: -0.32, giro: -10, escala: 0.95 },
    cel: { x: -0.25, y: -0.62, giro: -9, escala: 0.94 },
    espera: { x: -0.55, y: -0.74, giro: -8 },
    esperaCel: { x: -0.7, y: -0.55, giro: -8 },
  },
];

export interface Passo {
  titulo: string;
  texto: string;
}

/** Jornada do pedido: um passo aparece cada vez que uma camada assenta. */
export const JORNADA: Passo[] = [
  {
    titulo: 'O cliente aponta a câmera para o QR',
    texto: 'O cardápio abre no navegador, com a cara da sua loja. Ninguém precisa baixar aplicativo.',
  },
  {
    titulo: 'O pedido cai no seu painel',
    texto: 'Itens, observações e endereço chegam na hora, direto para você. Nenhum intermediário lê o pedido antes.',
  },
  {
    titulo: 'A cozinha prepara',
    texto: 'Um toque muda o status e o cliente acompanha pelo celular, sem ligar para perguntar.',
  },
  {
    titulo: 'Saiu para entrega',
    texto: 'Taxa por bairro, pedido mínimo e retirada no balcão: quem decide as regras da entrega é você.',
  },
  {
    titulo: 'O Pix cai na conta da loja',
    texto: 'Na sua chave, na hora. O Rende não segura o seu dinheiro e não leva parte da venda.',
  },
];

/**
 * Em que camada (índice em CAMADAS) cada passo da jornada aparece.
 * Tomate e alface assentam juntos no passo 4.
 */
export const PASSO_POR_CAMADA = [1, 2, 3, 4, 4, 5];

/** Pedido de exemplo do cartão do painel (o mesmo restaurante de demonstração do painel). */
export const PEDIDO_EXEMPLO = {
  numero: '#1048',
  cliente: 'Marina Alves',
  hora: '19:42',
  itens: 'Bocca Duplo, batata média, refrigerante',
  totalCentavos: 6830,
};

export const STATUS_CARTAO = ['Recebido', 'Preparo', 'Saiu', 'Pago'];

/** Qual status do cartão fica aceso em cada passo (0 = nenhum). */
export function statusDoPasso(passo: number): number {
  if (passo <= 1) return 0;
  if (passo === 2) return 1;
  if (passo === 3) return 2;
  if (passo === 4) return 3;
  return 4;
}
