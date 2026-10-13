/**
 * Mock da biblioteca motion para o Jest.
 * O jsdom não tem layout nem IntersectionObserver de verdade, então as funções
 * viram jest.fn(): os testes conferem que foram chamadas, sem animar nada.
 * inView chama o callback na hora (como se o elemento já estivesse na tela).
 */
export const animate = jest.fn(() => ({ stop: jest.fn(), cancel: jest.fn(), complete: jest.fn() }));
export const inView = jest.fn((_elemento: Element, aoEntrar: (alvo: Element) => void) => {
  aoEntrar(_elemento);
  return jest.fn();
});
export const stagger = jest.fn(() => 0);
