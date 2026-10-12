import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cobranca, Dashboard, NovaCobranca, Recebivel } from '../models/painel.model';

/** Chamadas de leitura/escrita do painel que não têm lógica própria (dashboard, recebíveis, cobranças). */
@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  recebiveis(): Observable<Recebivel[]> {
    return this.http.get<Recebivel[]>('/api/recebiveis');
  }

  criarCobranca(dados: NovaCobranca): Observable<Cobranca> {
    return this.http.post<Cobranca>('/api/cobrancas', dados);
  }
}
