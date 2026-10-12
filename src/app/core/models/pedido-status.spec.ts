import { contaComoVenda, podeTransicionar, proximosStatus, TODOS_STATUS } from './pedido-status';
import { calcularLiquido } from './pedido.model';

describe('máquina de estados do pedido', () => {
  it('segue o fluxo aguardando_pagamento -> recebido -> preparo -> pronto -> saiu -> entregue', () => {
    expect(podeTransicionar('aguardando_pagamento', 'recebido')).toBe(true);
    expect(podeTransicionar('recebido', 'preparo')).toBe(true);
    expect(podeTransicionar('preparo', 'pronto')).toBe(true);
    expect(podeTransicionar('pronto', 'saiu')).toBe(true);
    expect(podeTransicionar('saiu', 'entregue')).toBe(true);
  });

  it('não permite pular etapas nem voltar', () => {
    expect(podeTransicionar('recebido', 'entregue')).toBe(false);
    expect(podeTransicionar('preparo', 'recebido')).toBe(false);
    expect(podeTransicionar('aguardando_pagamento', 'preparo')).toBe(false);
  });

  it('entregue e cancelado são estados finais', () => {
    expect(proximosStatus('entregue')).toEqual([]);
    expect(proximosStatus('cancelado')).toEqual([]);
  });

  it('só dá para cancelar antes de o pedido sair da cozinha', () => {
    const podemCancelar = TODOS_STATUS.filter((s) => podeTransicionar(s, 'cancelado'));
    expect(podemCancelar).toEqual(['aguardando_pagamento', 'recebido', 'preparo']);
  });

  it('só conta como venda o pedido pago e não cancelado', () => {
    expect(contaComoVenda('aguardando_pagamento')).toBe(false);
    expect(contaComoVenda('cancelado')).toBe(false);
    expect(contaComoVenda('preparo')).toBe(true);
    expect(contaComoVenda('entregue')).toBe(true);
  });
});

describe('receita líquida por forma de pagamento', () => {
  it('desconta a taxa de cada canal', () => {
    expect(calcularLiquido(10_000, 'pix')).toEqual({ taxaCentavos: 99, liquidoCentavos: 9_901 });
    expect(calcularLiquido(10_000, 'credito')).toEqual({ taxaCentavos: 399, liquidoCentavos: 9_601 });
    expect(calcularLiquido(10_000, 'debito')).toEqual({ taxaCentavos: 189, liquidoCentavos: 9_811 });
  });

  it('dinheiro não tem taxa', () => {
    expect(calcularLiquido(4_590, 'dinheiro')).toEqual({ taxaCentavos: 0, liquidoCentavos: 4_590 });
  });
});
