import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const auth = { login: jest.fn() };

  function criar() {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function digitar(el: HTMLElement, seletor: string, valor: string) {
    const input = el.querySelector<HTMLInputElement>(seletor)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(() => auth.login.mockReset());

  it('não chama o login e mostra erros quando o formulário está vazio', async () => {
    const { fixture, el } = criar();
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Campo obrigatório.');
  });

  it('rejeita e-mail inválido e senha curta', async () => {
    const { fixture, el } = criar();
    digitar(el, '#email', 'sem-arroba');
    digitar(el, '#senha', '123');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('e-mail válido');
    expect(el.textContent).toContain('curto demais');
  });

  it('com dados válidos faz login e navega para o dashboard', async () => {
    auth.login.mockReturnValue(of(undefined));
    const { fixture, el } = criar();
    const navegar = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    digitar(el, '#email', 'dono@bocca.com.br');
    digitar(el, '#senha', 'senha123');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith('dono@bocca.com.br', 'senha123');
    expect(navegar).toHaveBeenCalledWith('/dashboard');
  });

  it('mostra mensagem quando o login falha', async () => {
    auth.login.mockReturnValue(throwError(() => new Error('401')));
    const { fixture, el } = criar();

    digitar(el, '#email', 'dono@bocca.com.br');
    digitar(el, '#senha', 'senha123');
    el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('E-mail ou senha inválidos');
  });
});
