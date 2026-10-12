/**
 * Regra de ouro do projeto: dinheiro é SEMPRE um número inteiro de centavos.
 * Só convertemos para texto (R$ 12,34) na hora de mostrar na tela.
 * Isso evita erros de ponto flutuante (0.1 + 0.2 !== 0.3).
 */

const formatador = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** 1234 -> "R$ 12,34" */
export function formatarMoeda(centavos: number): string {
  return formatador.format(centavos / 100);
}

/** Extrai só os dígitos do texto digitado e devolve em centavos: "R$ 12,34" -> 1234 */
export function textoParaCentavos(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '');
  return digitos === '' ? null : Number(digitos);
}

/** Calcula uma porcentagem em "basis points" (1 bp = 0,01%) sem usar decimais. */
export function aplicarBps(centavos: number, bps: number): number {
  return Math.round((centavos * bps) / 10_000);
}

/** 399 bps -> "3,99%" */
export function formatarBps(bps: number): string {
  return (bps / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}
