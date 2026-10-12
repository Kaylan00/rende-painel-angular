import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { erroInterceptor } from '../erro.interceptor';
import { NotificacaoService } from '../notificacao.service';
import { authGuard, visitanteGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const SESSAO = { token: 'abc123', lojista: 'Bocca Burger' };

function configurar() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor, erroInterceptor])),
      provideHttpClientTesting(),
    ],
  });
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    configurar();
  });

  it('começa deslogado', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.autenticado()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('login guarda a sessão (signals e localStorage)', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth.login('dono@bocca.com', 'senha123').subscribe();
    const req = http.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'dono@bocca.com', senha: 'senha123' });
    req.flush(SESSAO);

    expect(auth.autenticado()).toBe(true);
    expect(auth.lojista()).toBe('Bocca Burger');
    expect(JSON.parse(localStorage.getItem('rende.sessao') ?? '{}')).toEqual(SESSAO);
  });

  it('logout limpa tudo e volta para /login', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    const auth = TestBed.inject(AuthService);
    const navegar = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(auth.autenticado()).toBe(true); // restaurou do localStorage
    auth.logout();

    expect(auth.autenticado()).toBe(false);
    expect(localStorage.getItem('rende.sessao')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });

  it('ignora JSON corrompido no localStorage', () => {
    localStorage.setItem('rende.sessao', '{quebrado');
    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
  });
});

describe('guards', () => {
  const rota = {} as ActivatedRouteSnapshot;
  const estado = { url: '/pedidos' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    configurar();
  });

  it('authGuard redireciona visitante para /login guardando a rota pedida', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard(rota, estado));
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(resultado as ReturnType<Router['createUrlTree']>)).toBe('/login?retorno=%2Fpedidos');
  });

  it('authGuard libera quem está logado', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    expect(TestBed.runInInjectionContext(() => authGuard(rota, estado))).toBe(true);
  });

  it('visitanteGuard manda quem já está logado para o dashboard', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    const resultado = TestBed.runInInjectionContext(() => visitanteGuard(rota, estado));
    expect(TestBed.inject(Router).serializeUrl(resultado as ReturnType<Router['createUrlTree']>)).toBe('/dashboard');
  });
});

describe('interceptors', () => {
  let http: HttpTestingController;
  let cliente: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    configurar();
    http = TestBed.inject(HttpTestingController);
    cliente = TestBed.inject(HttpClient);
  });

  it('authInterceptor anexa o token nas chamadas /api', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    cliente.get('/api/pedidos').subscribe();
    expect(http.expectOne('/api/pedidos').request.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('authInterceptor não anexa token no login nem em URLs externas', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    cliente.post('/api/login', {}).subscribe();
    cliente.get('https://outro-site.com/x').subscribe();
    expect(http.expectOne('/api/login').request.headers.has('Authorization')).toBe(false);
    expect(http.expectOne('https://outro-site.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('erroInterceptor trata 401 deslogando e avisando, e repassa o erro', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    const auth = TestBed.inject(AuthService);
    jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const avisos = TestBed.inject(NotificacaoService);
    const aoErrar = jest.fn();

    cliente.get('/api/pedidos').subscribe({ error: aoErrar });
    http.expectOne('/api/pedidos').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.autenticado()).toBe(false);
    expect(avisos.avisos()[0].texto).toContain('sessão expirou');
    expect(aoErrar).toHaveBeenCalled();
  });

  it('erroInterceptor avisa em erro 500 sem deslogar', () => {
    localStorage.setItem('rende.sessao', JSON.stringify(SESSAO));
    const auth = TestBed.inject(AuthService);
    const avisos = TestBed.inject(NotificacaoService);

    cliente.get('/api/dashboard').subscribe({ error: () => undefined });
    http.expectOne('/api/dashboard').flush({}, { status: 500, statusText: 'Server Error' });

    expect(auth.autenticado()).toBe(true);
    expect(avisos.avisos()[0].texto).toContain('problema no servidor');
  });

  it('401 no próprio login não derruba a sessão nem mostra "sessão expirou"', () => {
    const avisos = TestBed.inject(NotificacaoService);
    cliente.post('/api/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(avisos.avisos()).toHaveLength(0);
  });
});
