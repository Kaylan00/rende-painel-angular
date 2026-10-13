import { MODELOS, ModeloLoja } from '../conteudo';

/** "R$ 41,90" -> 4190 (centavos inteiros, como no resto do projeto). */
export function precoEmCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  return digitos === '' ? 0 : Number(digitos);
}

export interface PedidoAoVivo {
  id: number;
  /** índice da loja em MODELOS */
  loja: number;
  numero: number;
  item: string;
  quantidade: number;
  valorCentavos: number;
  forma: 'Pix' | 'Cartão';
}

/**
 * O n-ésimo pedido "ao vivo" da rede de demonstração. Determinístico (não usa Math.random):
 * o mesmo n sempre gera o mesmo pedido, então dá para testar e a tela não pisca diferente
 * a cada recarga. Passa por todas as lojas antes de repetir.
 */
export function pedidoAoVivo(n: number, lojas: ModeloLoja[] = MODELOS): PedidoAoVivo {
  const loja = (n * 5 + 2) % lojas.length;
  const cardapio = lojas[loja].itens;
  const escolhido = cardapio[(n * 7) % cardapio.length];
  const quantidade = n % 3 === 0 ? 2 : 1;
  return {
    id: n,
    loja,
    numero: 2040 + n * 3 + loja,
    item: escolhido.nome,
    quantidade,
    valorCentavos: precoEmCentavos(escolhido.preco) * quantidade,
    forma: n % 4 === 3 ? 'Cartão' : 'Pix',
  };
}
