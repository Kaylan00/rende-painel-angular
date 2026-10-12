import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { proximosStatus } from '../models/pedido-status';
import { Pedido } from '../models/pedido.model';
import { montarDashboard, montarRecebiveis, resumirPorForma } from './mock-calculos';
import { mockApiInterceptor, reiniciarMock } from './mock-api.interceptor';

function pedido(parcial: Partial<Pedido>): Pedido {
  return {
    id: 1,
    numero: 1,
    cliente: 'Teste',
    itens: 'X-Bacon',
    totalCentavos: 10_000,
    formaPagamento: 'pix',
    status: 'entregue',
    criadoEm: new Date(2026, 9, 12, 12, 0).toISOString(),
    ...parcial,
  };
}

const AGORA = new Date(2026, 9, 12, 15, 0); // 12/10/2026

describe('cálculos do mock (regra de negócio em funções puras)', () => {
  it('resume por forma de pagamento com bruto, taxa e líquido, ignorando cancelados', () => {
    const resumo = resumirPorForma([
      pedido({ formaPagamento: 'credito', totalCentavos: 10_000 }),
      pedido({ id: 2, formaPagamento: 'credito', totalCentavos: 5_000 }),
      pedido({ id: 3, formaPagamento: 'credito', totalCentavos: 9_999, status: 'cancelado' }),
    ]);
    const credito = resumo.find((r) => r.forma === 'credito');
    expect(credito).toEqual({
      forma: 'credito', pedidos: 2, brutoCentavos: 15_000, taxaBps: 399, taxaCentavos: 599, liquidoCentavos: 14_401,
    });
    expect(resumo).toHaveLength(4); // pix, crédito, débito, dinheiro
  });

  it('dashboard: vendas do dia, ticket médio e a receber', () => {
    const dash = montarDashboard(
      [
        pedido({ totalCentavos: 3_000 }),
        pedido({ id: 2, totalCentavos: 5_000, formaPagamento: 'credito' }),
        pedido({ id: 3, totalCentavos: 9_000, status: 'aguardando_pagamento' }), // não conta
        pedido({ id: 4, totalCentavos: 7_000, criadoEm: new Date(2026, 9, 10, 12).toISOString() }), // outro dia
      ],
      AGORA,
    );
    expect(dash.vendasHojeCentavos).toBe(8_000);
    expect(dash.pedidosHoje).toBe(2);
    expect(dash.ticketMedioCentavos).toBe(4_000);
    expect(dash.vendasUltimosDias).toHaveLength(7);
    expect(dash.vendasUltimosDias[6]).toEqual({ data: '2026-10-12', totalCentavos: 8_000 });
    // só o crédito fica a receber (líquido de 5.000 com taxa 3,99% = 5.000 - 200 = 4.800)
    expect(dash.aReceberCentavos).toBe(4_800);
  });

  it('recebíveis: Pix e dinheiro não entram; crédito cai em 30 dias, débito em 1 dia', () => {
    const lista = montarRecebiveis(
      [
        pedido({ formaPagamento: 'pix' }),
        pedido({ id: 2, formaPagamento: 'dinheiro' }),
        pedido({ id: 3, formaPagamento: 'debito', totalCentavos: 10_000 }),
        pedido({ id: 4, formaPagamento: 'credito', totalCentavos: 10_000 }),
        pedido({ id: 5, formaPagamento: 'credito', totalCentavos: 10_000 }),
      ],
      '2026-10-12',
    );
    expect(lista.map((r) => [r.dataPrevista, r.formaPagamento, r.pedidos])).toEqual([
      ['2026-10-13', 'debito', 1],
      ['2026-11-11', 'credito', 2], // agrupou os dois pedidos
    ]);
    expect(lista[0].liquidoCentavos).toBe(9_811);
  });
});

describe('mockApiInterceptor (back-end falso)', () => {
  let http: HttpClient;
  const cabecalho = { headers: { Authorization: 'Bearer rende-token-fake-123' } };

  beforeEach(() => {
    reiniciarMock();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))] });
    http = TestBed.inject(HttpClient);
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  /** O mock responde com atraso (delay); avançamos o relógio falso para ele "responder". */
  async function esperar<T>(promessa: Promise<T>): Promise<T> {
    await jest.advanceTimersByTimeAsync(1000);
    return promessa;
  }

  it('login com senha curta devolve 401', async () => {
    const resultado = firstValueFrom(http.post('/api/login', { email: 'a@b.com', senha: '123' })).catch((e) => e);
    expect((await esperar(resultado)).status).toBe(401);
  });

  it('login válido devolve token e nome do lojista', async () => {
    const resultado = await esperar(firstValueFrom(http.post<{ lojista: string }>('/api/login', { email: 'a@b.com', senha: '123456' })));
    expect(resultado.lojista).toBe('Bocca Burger');
  });

  it('rota protegida sem token devolve 401', async () => {
    const resultado = firstValueFrom(http.get('/api/dashboard')).catch((e) => e);
    expect((await esperar(resultado)).status).toBe(401);
  });

  it('lista pedidos paginados e filtrados', async () => {
    const pagina = await esperar(
      firstValueFrom(http.get<{ itens: Pedido[]; total: number }>('/api/pedidos?pagina=1&porPagina=3&forma=pix', cabecalho)),
    );
    expect(pagina.itens.length).toBeLessThanOrEqual(3);
    expect(pagina.itens.every((p) => p.formaPagamento === 'pix')).toBe(true);
    expect(pagina.total).toBeGreaterThan(3);
  });

  it('recusa transição de status inválida com 409 e aceita a válida', async () => {
    const todos = await esperar(firstValueFrom(http.get<{ itens: Pedido[] }>('/api/pedidos?status=entregue&porPagina=1', cabecalho)));
    const id = todos.itens[0].id;
    const invalida = firstValueFrom(http.patch(`/api/pedidos/${id}/status`, { status: 'preparo' }, cabecalho)).catch((e) => e);
    expect((await esperar(invalida)).status).toBe(409);

    // pega algum pedido ainda em andamento e avança para o próximo status permitido
    for (const status of ['aguardando_pagamento', 'recebido', 'preparo', 'pronto', 'saiu'] as const) {
      const lista = await esperar(firstValueFrom(http.get<{ itens: Pedido[] }>(`/api/pedidos?status=${status}&porPagina=1`, cabecalho)));
      if (lista.itens.length === 0) continue;
      const [proximo] = proximosStatus(status);
      const atualizado = await esperar(
        firstValueFrom(http.patch<Pedido>(`/api/pedidos/${lista.itens[0].id}/status`, { status: proximo }, cabecalho)),
      );
      expect(atualizado.status).toBe(proximo);
      return;
    }
    throw new Error('o mock deveria ter ao menos um pedido em andamento');
  });

  it('cria cobrança com código e link', async () => {
    const cobranca = await esperar(
      firstValueFrom(http.post<{ codigo: string; url: string }>('/api/cobrancas', { valorCentavos: 4_590, tipo: 'pix' }, cabecalho)),
    );
    expect(cobranca.url).toBe(`https://pay.rende.app/c/${cobranca.codigo}`);
  });
});
