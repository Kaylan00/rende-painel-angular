import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { NotificacaoService } from './notificacao.service';

/**
 * Tratamento global de erro HTTP:
 *  - 401 fora do login: sessão expirou, desloga e avisa;
 *  - 5xx ou sem rede: aviso genérico.
 * O erro continua sendo repassado (throwError) para a tela poder mostrar o estado de erro.
 */
export const erroInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const avisos = inject(NotificacaoService);

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && req.url !== '/api/login') {
        auth.logout();
        avisos.erro('Sua sessão expirou. Entre novamente.');
      } else if (erro.status >= 500 || erro.status === 0) {
        avisos.erro('Tivemos um problema no servidor. Tente de novo em instantes.');
      }
      return throwError(() => erro);
    }),
  );
};
