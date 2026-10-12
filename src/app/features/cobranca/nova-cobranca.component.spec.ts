import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { NovaCobrancaComponent } from './nova-cobranca.component';

describe('NovaCobrancaComponent', () => {
  const api = { criarCobranca: jest.fn() };

  function criar() {
    TestBed.configureTestingModule({
      imports: [NovaCobrancaComponent],
      providers: [{ provide: PainelService, useValue: api }],
    });
    const fixture = TestBed.createComponent(NovaCobrancaComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const digitar = (seletor: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(seletor)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    };
    const enviar = async () => {
      el.querySelector<HTMLButtonElement>('form button[type=submit]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const modalAberto = () => el.querySelector('dialog')!.hasAttribute('open');
    return { fixture, el, digitar, enviar, modalAberto };
  }

  function preencherValido(c: ReturnType<typeof criar>) {
    c.digitar('#descricao', 'Combo festa');
    c.digitar('#valor', '4590');
    c.digitar('#cliente', 'Marina Alves');
  }

  beforeEach(() => api.criarCobranca.mockReset());

  it('formulário vazio: mostra erros e não abre a confirmação', async () => {
    const c = criar();
    await c.enviar();
    expect(c.el.textContent).toContain('Campo obrigatório.');
    expect(c.modalAberto()).toBe(false);
  });

  it('máscara de moeda: mostra reais, o formulário guarda centavos', () => {
    const c = criar();
    c.digitar('#valor', '4590');
    c.fixture.detectChanges();

    const campo = c.el.querySelector<HTMLInputElement>('#valor')!;
    expect(campo.value.replace(/\u00a0/g, ' ')).toBe('R$ 45,90');
    expect(c.el.querySelector('.preview .valor')?.textContent?.replace(/\u00a0/g, ' ')).toBe('R$ 45,90');
  });

  it('valida valor mínimo (R$ 1,00) e máximo (R$ 5.000,00)', async () => {
    const c = criar();
    c.digitar('#valor', '50');
    c.fixture.detectChanges();
    expect(c.el.textContent).toContain('O valor mínimo é');

    c.digitar('#valor', '500001');
    c.fixture.detectChanges();
    expect(c.el.textContent).toContain('O valor máximo é');
  });

  it('valida CPF/CNPJ quando preenchido', () => {
    const c = criar();
    c.digitar('#documento', '123');
    c.fixture.detectChanges();
    expect(c.el.textContent).toContain('CPF ou CNPJ inválido.');

    c.digitar('#documento', '52998224725');
    c.fixture.detectChanges();
    expect(c.el.textContent).not.toContain('CPF ou CNPJ inválido.');
  });

  it('formulário válido abre o modal de confirmação com o resumo', async () => {
    const c = criar();
    preencherValido(c);
    await c.enviar();

    expect(c.modalAberto()).toBe(true);
    const modal = c.el.querySelector('dialog')!.textContent!.replace(/\u00a0/g, ' ');
    expect(modal).toContain('Marina Alves');
    expect(modal).toContain('R$ 45,90');
  });

  it('confirmar envia a cobrança em centavos e mostra o link criado', async () => {
    api.criarCobranca.mockReturnValue(
      of({ id: 'cob_1', codigo: 'ABC123', url: 'https://pay.rende.app/c/ABC123', valorCentavos: 4_590, clienteNome: 'Marina Alves' }),
    );
    const c = criar();
    preencherValido(c);
    await c.enviar();

    c.el.querySelector<HTMLButtonElement>('dialog .acoes-modal button:last-child')!.click();
    await c.fixture.whenStable();
    c.fixture.detectChanges();

    expect(api.criarCobranca).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'pix', descricao: 'Combo festa', valorCentavos: 4_590, clienteNome: 'Marina Alves', validadeHoras: 24 }),
    );
    expect(c.modalAberto()).toBe(false);
    expect(c.el.querySelector('.criada')?.textContent).toContain('https://pay.rende.app/c/ABC123');
  });

  it('trocar para link de pagamento troca o preview', () => {
    const c = criar();
    expect(c.el.querySelector('app-qr-placeholder')).not.toBeNull();

    const radio = c.el.querySelector<HTMLInputElement>('input[value=link]')!;
    radio.click();
    c.fixture.detectChanges();

    expect(c.el.querySelector('app-qr-placeholder')).toBeNull();
    expect(c.el.querySelector('.preview .link')?.textContent).toContain('pay.rende.app/c/');
  });
});
