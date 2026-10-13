/**
 * Mock do GSAP (e do ScrollTrigger) para o Jest.
 * O jsdom não tem layout nem rolagem de verdade: as funções viram jest.fn()
 * e devolvem objetos com os métodos que a landing chama (timeline, context, quickTo).
 */
const tween = () => ({ kill: jest.fn(), progress: jest.fn(), pause: jest.fn(), play: jest.fn() });

const timeline = () => {
  const tl: Record<string, jest.Mock> = {};
  for (const metodo of ['to', 'from', 'fromTo', 'set', 'add', 'call', 'addLabel', 'eventCallback']) tl[metodo] = jest.fn(() => tl);
  tl['time'] = jest.fn(() => 0);
  tl['kill'] = jest.fn();
  tl['progress'] = jest.fn(() => 0);
  return tl;
};

export const gsap = {
  registerPlugin: jest.fn(),
  to: jest.fn(tween),
  from: jest.fn(tween),
  fromTo: jest.fn(tween),
  set: jest.fn(),
  timeline: jest.fn(timeline),
  quickTo: jest.fn(() => jest.fn()),
  killTweensOf: jest.fn(),
  context: jest.fn((fn?: () => void) => {
    fn?.();
    return { revert: jest.fn(), add: jest.fn() };
  }),
  matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
  ticker: { add: jest.fn(), remove: jest.fn(), lagSmoothing: jest.fn() },
  utils: { clamp: (min: number, max: number, v: number) => Math.min(max, Math.max(min, v)) },
};

export const ScrollTrigger = {
  create: jest.fn(() => ({ kill: jest.fn() })),
  config: jest.fn(),
  refresh: jest.fn(),
  update: jest.fn(),
};

export default gsap;
