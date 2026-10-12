import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { Dashboard } from '../../core/models/painel.model';
import { DashboardComponent } from './dashboard.component';

const dashboard: Dashboard = {
  vendasHojeCentavos: 36_490,
  pedidosHoje: 8,
  ticketMedioCentavos: 4_561,
  aReceberCentavos: 102_553,
  vendasUltimosDias: [{ data: '2026-10-12', totalCentavos: 36_490 }],
  porFormaPagamento: [
    { forma: 'pix', pedidos: 4, brutoCentavos: 10_000, taxaBps: 99, taxaCentavos: 99, liquidoCentavos: 9_901 },
    { forma: 'credito', pedidos: 2, brutoCentavos: 10_000, taxaBps: 399, taxaCentavos: 399, liquidoCentavos: 9_601 },
    { forma: 'debito', pedidos: 1, brutoCentavos: 10_000, taxaBps: 189, taxaCentavos: 189, liquidoCentavos: 9_811 },
    { forma: 'dinheiro', pedidos: 1, brutoCentavos: 5_000, taxaBps: 0, taxaCentavos: 0, liquidoCentavos: 5_000 },
  ],
  ultimosPedidos: [
    {
      id: 1, numero: 1001, cliente: 'Marina Alves', itens: 'X-Bacon', totalCentavos: 3_890,
      formaPagamento: 'pix', status: 'preparo', criadoEm: '2026-10-12T15:00:00.000Z',
    },
  ],
};

describe('DashboardComponent', () => {
  const api = { dashboard: jest.fn() };

  function criar() {
    TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [{ provide: PainelService, useValue: api }] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('mostra as métricas, a receita líquida de cada canal (com taxa) e os últimos pedidos', () => {
    api.dashboard.mockReturnValue(of(dashboard));
    const { el } = criar();
    const texto = el.textContent!.replace(/\u00a0/g, ' ');

    expect(texto).toContain('R$ 364,90'); // vendas do dia
    expect(texto).toContain('R$ 45,61'); // ticket médio
    expect(texto).toContain('R$ 99,01'); // líquido do Pix
    expect(texto).toContain('taxa 3,99%'); // taxa do crédito
    expect(texto).toContain('Total líquido: R$ 343,13'); // soma dos líquidos
    expect(texto).toContain('Marina Alves');
  });

  it('mostra erro e permite tentar de novo', () => {
    api.dashboard.mockReset().mockReturnValueOnce(throwError(() => new Error('x'))).mockReturnValue(of(dashboard));
    const { fixture, el } = criar();

    expect(el.querySelector('[role=alert]')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    fixture.detectChanges();

    expect(api.dashboard).toHaveBeenCalledTimes(2);
    expect(el.textContent).toContain('Vendas do dia');
  });
});
