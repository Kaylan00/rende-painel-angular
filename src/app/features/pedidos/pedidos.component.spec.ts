import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { PedidosService } from '../../core/api/pedidos.service';
import { Pagina, Pedido } from '../../core/models/pedido.model';
import { PedidosComponent } from './pedidos.component';

function pedido(parcial: Partial<Pedido>): Pedido {
  return {
    id: 1, numero: 1001, cliente: 'Marina Alves', itens: 'X-Bacon', totalCentavos: 3_890,
    formaPagamento: 'pix', status: 'recebido', criadoEm: '2026-10-12T15:00:00.000Z', ...parcial,
  };
}

const pagina = (itens: Pedido[], total = itens.length): Pagina<Pedido> => ({ itens, total, pagina: 1, porPagina: 8 });

describe('PedidosComponent', () => {
  const api = { buscar: jest.fn(), atualizarStatus: jest.fn() };

  function criar() {
    TestBed.configureTestingModule({
      imports: [PedidosComponent],
      providers: [{ provide: PedidosService, useValue: api }],
    });
    const fixture = TestBed.createComponent(PedidosComponent);
    fixture.detectChanges();
    // os membros do componente são protected: acessamos via cast só nos testes
    const comp = fixture.componentInstance as unknown as {
      filtro: { patchValue(v: object): void };
    };
    return { fixture, comp, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    api.buscar.mockReset().mockReturnValue(of(pagina([pedido({})])));
    api.atualizarStatus.mockReset();
  });

  afterEach(() => jest.useRealTimers());

  it('busca ao abrir e mostra os pedidos na tabela', () => {
    const { el } = criar();
    expect(api.buscar).toHaveBeenCalledTimes(1);
    expect(el.querySelector('table')?.textContent).toContain('Marina Alves');
    expect(el.textContent).toContain('R$');
  });

  it('debounce: várias mudanças seguidas no filtro geram UMA busca só', () => {
    const { comp } = criar();
    api.buscar.mockClear();

    comp.filtro.patchValue({ status: 'preparo' });
    jest.advanceTimersByTime(100);
    comp.filtro.patchValue({ status: 'pronto' });
    jest.advanceTimersByTime(100);
    comp.filtro.patchValue({ formaPagamento: 'pix' });
    expect(api.buscar).not.toHaveBeenCalled(); // ainda esperando o usuário parar

    jest.advanceTimersByTime(300);
    expect(api.buscar).toHaveBeenCalledTimes(1);
    expect(api.buscar.mock.calls[0][0]).toEqual({ status: 'pronto', formaPagamento: 'pix', de: '', ate: '' });
  });

  it('switchMap: a resposta antiga é descartada quando um filtro novo chega', () => {
    const primeira = new Subject<Pagina<Pedido>>();
    api.buscar.mockReset().mockReturnValueOnce(primeira).mockReturnValue(of(pagina([pedido({ cliente: 'Cliente Novo' })])));
    const { comp, fixture, el } = criar(); // 1ª busca fica pendente

    comp.filtro.patchValue({ status: 'preparo' });
    jest.advanceTimersByTime(300); // 2ª busca responde na hora
    primeira.next(pagina([pedido({ cliente: 'Cliente Velho' })])); // chega atrasada
    fixture.detectChanges();

    expect(primeira.observed).toBe(false); // foi cancelada pelo switchMap
    expect(el.textContent).toContain('Cliente Novo');
    expect(el.textContent).not.toContain('Cliente Velho');
  });

  it('mostra estado vazio quando não há pedidos', () => {
    api.buscar.mockReturnValue(of(pagina([])));
    const { el } = criar();
    expect(el.textContent).toContain('Nenhum pedido encontrado');
    expect(el.querySelector('table')).toBeNull();
  });

  it('mostra erro com botão de tentar novamente, que refaz a busca', () => {
    api.buscar.mockReturnValueOnce(throwError(() => new Error('falhou'))).mockReturnValue(of(pagina([pedido({})])));
    const { fixture, el } = criar();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('Não foi possível carregar os pedidos');
    el.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    fixture.detectChanges();

    expect(api.buscar).toHaveBeenCalledTimes(2);
    expect(el.querySelector('table')).not.toBeNull();
  });

  it('só oferece as transições permitidas pela máquina de estados', () => {
    api.buscar.mockReturnValue(of(pagina([pedido({ status: 'preparo' })])));
    const { el } = criar();
    const botoes = [...el.querySelectorAll('tbody button')].map((b) => b.textContent?.trim());
    expect(botoes).toEqual(['Marcar pronto', 'Cancelar']);
  });

  it('avançar o status chama a API e recarrega a lista', () => {
    api.atualizarStatus.mockReturnValue(of(pedido({ status: 'preparo' })));
    const { fixture, el } = criar();
    api.buscar.mockClear();

    el.querySelector<HTMLButtonElement>('tbody button')!.click(); // "Iniciar preparo"
    fixture.detectChanges();

    expect(api.atualizarStatus).toHaveBeenCalledWith(1, 'preparo');
    expect(api.buscar).toHaveBeenCalledTimes(1);
  });
});
