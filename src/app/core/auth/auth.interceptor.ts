import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Anexa o token (fake) em toda chamada para a API, menos no login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  if (!token || !req.url.startsWith('/api/') || req.url === '/api/login') {
    return next(req);
  }
  // Requests são imutáveis: clone() cria uma cópia com o header novo.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
