import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FiltroPedidos } from '../models/pedido.model';
import { PedidosService } from './pedidos.service';

const FILTRO_VAZIO: FiltroPedidos = { status: '', formaPagamento: '', de: '', ate: '' };

describe('PedidosService', () => {
  let servico: PedidosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servico = TestBed.inject(PedidosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca só com paginação quando não há filtros', () => {
    servico.buscar(FILTRO_VAZIO, 1).subscribe();
    const req = http.expectOne((r) => r.url === '/api/pedidos');
    expect(req.request.params.keys().sort()).toEqual(['pagina', 'porPagina']);
    req.flush({ itens: [], total: 0, pagina: 1, porPagina: 8 });
  });

  it('envia só os filtros preenchidos', () => {
    servico.buscar({ status: 'preparo', formaPagamento: 'pix', de: '2026-10-01', ate: '' }, 2, 5).subscribe();
    const req = http.expectOne((r) => r.url === '/api/pedidos');
    expect(req.request.params.get('status')).toBe('preparo');
    expect(req.request.params.get('forma')).toBe('pix');
    expect(req.request.params.get('de')).toBe('2026-10-01');
    expect(req.request.params.has('ate')).toBe(false);
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('porPagina')).toBe('5');
    req.flush({ itens: [], total: 0, pagina: 2, porPagina: 5 });
  });

  it('atualiza o status com PATCH', () => {
    servico.atualizarStatus(1001, 'pronto').subscribe();
    const req = http.expectOne('/api/pedidos/1001/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'pronto' });
    req.flush({});
  });
});
