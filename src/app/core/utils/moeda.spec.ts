import { MoedaPipe } from '../../shared/pipes/moeda.pipe';
import { aplicarBps, formatarBps, formatarMoeda, textoParaCentavos } from './moeda';

// Intl usa espaço "não quebrável" entre R$ e o número; trocamos por espaço normal para comparar.
const normalizar = (texto: string) => texto.replace(/\u00a0/g, ' ');

describe('moeda (centavos inteiros)', () => {
  it('formata centavos como reais', () => {
    expect(normalizar(formatarMoeda(1234))).toBe('R$ 12,34');
    expect(normalizar(formatarMoeda(0))).toBe('R$ 0,00');
    expect(normalizar(formatarMoeda(123456789))).toBe('R$ 1.234.567,89');
  });

  it('extrai centavos do texto digitado, ignorando tudo que não é dígito', () => {
    expect(textoParaCentavos('R$ 12,34')).toBe(1234);
    expect(textoParaCentavos('4590')).toBe(4590);
    expect(textoParaCentavos('abc')).toBeNull();
    expect(textoParaCentavos('')).toBeNull();
  });

  it('aplica taxa em basis points arredondando para centavo inteiro', () => {
    expect(aplicarBps(10_000, 399)).toBe(399); // 3,99% de R$ 100,00
    expect(aplicarBps(3_390, 99)).toBe(34); // 33,56 centavos -> arredonda
    expect(aplicarBps(5_000, 0)).toBe(0);
  });

  it('formata bps como porcentagem', () => {
    expect(formatarBps(399)).toBe('3,99%');
    expect(formatarBps(0)).toBe('0,00%');
  });

  it('o pipe formata centavos e trata valor vazio como zero', () => {
    const pipe = new MoedaPipe();
    expect(normalizar(pipe.transform(2790))).toBe('R$ 27,90');
    expect(normalizar(pipe.transform(null))).toBe('R$ 0,00');
  });
});
