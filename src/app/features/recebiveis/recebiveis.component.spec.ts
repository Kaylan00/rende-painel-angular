import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { Recebivel } from '../../core/models/painel.model';
import { agruparPorData, RecebiveisComponent } from './recebiveis.component';

const lista: Recebivel[] = [
  { id: 'a', dataPrevista: '2026-10-14', formaPagamento: 'credito', pedidos: 2, brutoCentavos: 10_000, liquidoCentavos: 9_601 },
  { id: 'b', dataPrevista: '2026-10-13', formaPagamento: 'debito', pedidos: 1, brutoCentavos: 5_000, liquidoCentavos: 4_906 },
  { id: 'c', dataPrevista: '2026-10-14', formaPagamento: 'debito', pedidos: 1, brutoCentavos: 2_000, liquidoCentavos: 1_962 },
];

describe('agruparPorData', () => {
  it('agrupa por data, soma o líquido e ordena por data', () => {
    const grupos = agruparPorData(lista);
    expect(grupos.map((g) => g.data)).toEqual(['2026-10-13', '2026-10-14']);
    expect(grupos[1].itens).toHaveLength(2);
    expect(grupos[1].liquidoCentavos).toBe(11_563);
  });
});

describe('RecebiveisComponent', () => {
  const api = { recebiveis: jest.fn() };

  function criar() {
    TestBed.configureTestingModule({ imports: [RecebiveisComponent], providers: [{ provide: PainelService, useValue: api }] });
    const fixture = TestBed.createComponent(RecebiveisComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('calcula os totais com computed signals e mostra uma seção por data', () => {
    api.recebiveis.mockReturnValue(of(lista));
    const { el } = criar();
    const texto = el.textContent!.replace(/\u00a0/g, ' ');

    // 9.601 + 4.906 + 1.962 = 16.469 -> R$ 164,69 ; bruto 17.000 ; taxas 531
    expect(texto).toContain('R$ 164,69');
    expect(texto).toContain('Bruto R$ 170,00');
    expect(texto).toContain('taxas R$ 5,31');
    expect(el.querySelectorAll('section.grupo')).toHaveLength(2);
    expect(texto).toContain('13/10/2026');
  });

  it('mostra estado vazio sem recebíveis', () => {
    api.recebiveis.mockReturnValue(of([]));
    expect(criar().el.textContent).toContain('não tem valores a receber');
  });

  it('mostra erro quando a API falha', () => {
    api.recebiveis.mockReturnValue(throwError(() => new Error('x')));
    expect(criar().el.querySelector('[role=alert]')).not.toBeNull();
  });
});
