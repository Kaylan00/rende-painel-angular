/**
 * Regras de movimento do projeto (usadas pelas diretivas de animação).
 * Animação aqui é só para orientar o olho: entrar, contar, crescer.
 * Quem pede menos movimento no sistema (prefers-reduced-motion) não vê nada disso.
 */

/** Curva "sai rápido, chega devagar": a mesma em todas as animações. */
export const CURVA_SUAVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** true quando o usuário pediu menos movimento ou o ambiente não tem matchMedia (testes, SSR). */
export function movimentoReduzido(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
