import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, startWith } from 'rxjs';

/** Os três estados que toda tela com dados remotos precisa tratar. */
export type Estado<T> =
  | { status: 'carregando' }
  | { status: 'ok'; dados: T }
  | { status: 'erro'; mensagem: string };

/**
 * Operador RxJS: transforma um Observable<T> em Observable<Estado<T>>.
 * Emite "carregando" primeiro, depois "ok" ou "erro" (catchError evita que o stream morra).
 */
export function comEstado<T>() {
  return (origem: Observable<T>): Observable<Estado<T>> =>
    origem.pipe(
      map((dados): Estado<T> => ({ status: 'ok', dados })),
      catchError((erro: unknown) => of<Estado<T>>({ status: 'erro', mensagem: mensagemDeErro(erro) })),
      startWith<Estado<T>>({ status: 'carregando' }),
    );
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse && erro.status === 0) {
    return 'Sem conexão com o servidor.';
  }
  if (erro instanceof HttpErrorResponse && typeof erro.error?.mensagem === 'string') {
    return erro.error.mensagem;
  }
  return 'Não foi possível carregar os dados. Tente novamente.';
}
