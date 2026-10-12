import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'sucesso' | 'erro' | 'info';
  texto: string;
}

/**
 * Avisos rápidos (toasts). Estado em signal: é síncrono, simples e o template
 * lê com `avisos()` sem precisar de subscribe.
 */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private proximoId = 1;
  private readonly _avisos = signal<Aviso[]>([]);
  /** Versão somente leitura para os componentes. */
  readonly avisos = this._avisos.asReadonly();

  sucesso(texto: string) {
    this.mostrar('sucesso', texto);
  }

  erro(texto: string) {
    this.mostrar('erro', texto);
  }

  info(texto: string) {
    this.mostrar('info', texto);
  }

  fechar(id: number) {
    this._avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private mostrar(tipo: Aviso['tipo'], texto: string, duracaoMs = 5000) {
    const id = this.proximoId++;
    this._avisos.update((lista) => [...lista, { id, tipo, texto }]);
    if (duracaoMs > 0) {
      setTimeout(() => this.fechar(id), duracaoMs);
    }
  }
}
