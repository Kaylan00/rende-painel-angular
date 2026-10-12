import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FiltroPedidos, Pagina, Pedido, StatusPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);

  buscar(filtro: FiltroPedidos, pagina: number, porPagina = 8): Observable<Pagina<Pedido>> {
    // só manda para a API os filtros que o usuário preencheu
    let params = new HttpParams().set('pagina', pagina).set('porPagina', porPagina);
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.formaPagamento) params = params.set('forma', filtro.formaPagamento);
    if (filtro.de) params = params.set('de', filtro.de);
    if (filtro.ate) params = params.set('ate', filtro.ate);

    return this.http.get<Pagina<Pedido>>('/api/pedidos', { params });
  }

  atualizarStatus(id: number, status: StatusPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`/api/pedidos/${id}/status`, { status });
  }
}
