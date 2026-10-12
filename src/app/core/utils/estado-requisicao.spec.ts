import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { comEstado, Estado, mensagemDeErro } from './estado-requisicao';

function coletar<T>(origem: Observable<Estado<T>>): Estado<T>[] {
  const emitidos: Estado<T>[] = [];
  origem.subscribe((e) => emitidos.push(e));
  return emitidos;
}

describe('comEstado', () => {
  it('emite carregando e depois ok com os dados', () => {
    const emitidos = coletar(of(42).pipe(comEstado()));
    expect(emitidos).toEqual([{ status: 'carregando' }, { status: 'ok', dados: 42 }]);
  });

  it('transforma erro em estado de erro sem derrubar o stream (catchError)', () => {
    const erro = new HttpErrorResponse({ status: 500, error: { mensagem: 'Falhou' } });
    const emitidos = coletar(throwError(() => erro).pipe(comEstado()));
    expect(emitidos).toEqual([{ status: 'carregando' }, { status: 'erro', mensagem: 'Falhou' }]);
  });

  it('usa mensagem genérica quando o erro não traz mensagem', () => {
    expect(mensagemDeErro(new Error('x'))).toContain('Não foi possível');
    expect(mensagemDeErro(new HttpErrorResponse({ status: 0 }))).toContain('conexão');
  });
});
