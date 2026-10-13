import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('rotas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient()] });
  });

  it('"/" abre a landing pública, sem pedir login', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('app-calculadora')).not.toBeNull();
  });

  it('o painel continua protegido: sem sessão vai para /entrar com o retorno', async () => {
    await RouterTestingHarness.create('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/entrar?retorno=%2Fdashboard');
  });

  it('o endereço antigo /login leva para /entrar', async () => {
    await RouterTestingHarness.create('/login');
    expect(TestBed.inject(Router).url).toBe('/entrar');
  });

  it('com sessão, /entrar manda direto para o dashboard', async () => {
    localStorage.setItem('rende.sessao', JSON.stringify({ token: 't', lojista: 'Bocca Burger' }));
    TestBed.inject(AuthService); // lê a sessão salva
    await RouterTestingHarness.create('/entrar');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
