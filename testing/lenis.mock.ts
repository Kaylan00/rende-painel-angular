/** Mock do Lenis (rolagem suave) para o Jest: só registra as chamadas. */
export default class Lenis {
  on = jest.fn();
  raf = jest.fn();
  scrollTo = jest.fn();
  destroy = jest.fn();
}
