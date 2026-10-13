import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { authInterceptor } from './core/auth/auth.interceptor';
import { erroInterceptor } from './core/erro.interceptor';
import { mockApiInterceptor } from './core/mock/mock-api.interceptor';
import { routes } from './app.routes';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // troca de tela com a View Transitions API (fade curto em styles.scss); onde não existe, troca normal
      withViewTransitions({ skipInitialTransition: true }),
      // âncoras da landing (#calculadora) e volta ao topo ao trocar de rota
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
    // A ordem importa: auth põe o token -> erro trata falhas -> mock responde (faz o papel do servidor).
    // Com uma API real, basta remover o mockApiInterceptor.
    provideHttpClient(withInterceptors([authInterceptor, erroInterceptor, mockApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
