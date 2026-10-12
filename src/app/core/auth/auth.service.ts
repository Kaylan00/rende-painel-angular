import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { Sessao } from '../models/painel.model';

const CHAVE_STORAGE = 'rende.sessao';

/**
 * Sessão do lojista. Estado em signals (síncrono, o guard e o interceptor
 * leem o valor na hora). O HTTP continua sendo Observable.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _sessao = signal<Sessao | null>(this.lerSessaoSalva());

  readonly sessao = this._sessao.asReadonly();
  readonly token = computed(() => this._sessao()?.token ?? null);
  readonly lojista = computed(() => this._sessao()?.lojista ?? '');
  readonly autenticado = computed(() => this._sessao() !== null);

  login(email: string, senha: string): Observable<void> {
    return this.http.post<Sessao>('/api/login', { email, senha }).pipe(
      tap((sessao) => {
        this._sessao.set(sessao);
        this.salvar(sessao);
      }),
      map(() => undefined),
    );
  }

  logout(irParaLogin = true) {
    this._sessao.set(null);
    this.salvar(null);
    if (irParaLogin) {
      this.router.navigate(['/login']);
    }
  }

  private lerSessaoSalva(): Sessao | null {
    try {
      const texto = localStorage.getItem(CHAVE_STORAGE);
      return texto ? (JSON.parse(texto) as Sessao) : null;
    } catch {
      return null; // storage bloqueado ou JSON corrompido
    }
  }

  private salvar(sessao: Sessao | null) {
    try {
      if (sessao) {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao));
      } else {
        localStorage.removeItem(CHAVE_STORAGE);
      }
    } catch {
      // sem storage, a sessão vale só até recarregar a página
    }
  }
}
