import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Guard funcional: sem sessão, redireciona para /login guardando a rota pedida. */
export const authGuard: CanActivateFn = (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { retorno: estado.url } });
};

/** Quem já está logado não precisa ver a tela de login. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? router.createUrlTree(['/dashboard']) : true;
};
