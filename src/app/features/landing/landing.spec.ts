import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CalculadoraComponent } from './calculadora/calculadora.component';
import { compararCustos, COMISSAO_APP_BPS, MENSALIDADE_RENDE_CENTAVOS } from './comparativo';
import { LandingComponent, montarReceita } from './landing.component';

const semEspacoDuro = (texto: string | null | undefined) => (texto ?? '').replace(/\u00a0/g, ' ');

describe('compararCustos (comissão x mensalidade)', () => {
  it('com R$ 30.000 e 27%: app leva R$ 8.100 e o Rende só a mensalidade', () => {
    const r = compararCustos(3_000_000);
    expect(r.comissaoAppCentavos).toBe(810_000);
    expect(r.sobraAppCentavos).toBe(2_190_000);
    expect(r.custoRendeCentavos).toBe(MENSALIDADE_RENDE_CENTAVOS);
    expect(r.sobraRendeCentavos).toBe(3_000_000 - MENSALIDADE_RENDE_CENTAVOS);
    expect(r.diferencaMesCentavos).toBe(810_000 - MENSALIDADE_RENDE_CENTAVOS);
    expect(r.diferencaAnoCentavos).toBe(r.diferencaMesCentavos * 12);
  });

  it('usa 27% como padrão e aceita outra comissão', () => {
    expect(compararCustos(100_000).comissaoAppCentavos).toBe((100_000 * COMISSAO_APP_BPS) / 10_000);
    expect(compararCustos(100_000, 1200).comissaoAppCentavos).toBe(12_000);
  });

  it('arredonda em centavos inteiros e nunca aceita faturamento negativo', () => {
    expect(compararCustos(333, 2700).comissaoAppCentavos).toBe(90); // 89,91 -> 90
    expect(compararCustos(-500).faturamentoCentavos).toBe(0);
  });

  it('em faturamento muito baixo a diferença fica negativa (a tela avisa)', () => {
    expect(compararCustos(10_000).diferencaMesCentavos).toBeLessThan(0);
  });
});

describe('CalculadoraComponent', () => {
  function criar() {
    const fixture = TestBed.createComponent(CalculadoraComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function mover(el: HTMLElement, seletor: string, valor: number) {
    const faixa = el.querySelector<HTMLInputElement>(seletor)!;
    faixa.value = String(valor);
    faixa.dispatchEvent(new Event('input'));
  }

  it('mostra o cenário padrão (R$ 30 mil, 27%)', () => {
    const { el } = criar();
    const texto = semEspacoDuro(el.textContent);
    expect(texto).toContain('27%');
    expect(texto).toContain('R$ 21.900,00'); // sobra no app
    expect(texto).toContain('R$ 29.871,00'); // sobra no Rende
    expect(texto).toContain('R$ 7.971,00'); // diferença no mês
  });

  it('recalcula (computed) quando o faturamento e a comissão mudam', () => {
    const { fixture, el } = criar();
    mover(el, '#faturamento', 10_000);
    mover(el, '#comissao', 12);
    fixture.detectChanges();

    const texto = semEspacoDuro(el.textContent);
    expect(texto).toContain('R$ 10.000,00');
    expect(texto).toContain('12% por pedido');
    expect(texto).toContain('R$ 1.200,00'); // comissão do app
    expect(semEspacoDuro(el.querySelector('[aria-live]')?.textContent)).toContain('R$ 1.071,00 a mais por mês');
  });

  it('as faixas têm rótulo e valor falado para leitor de tela', () => {
    const { el } = criar();
    const faixa = el.querySelector<HTMLInputElement>('#faturamento')!;
    expect(el.querySelector('label[for=faturamento]')).not.toBeNull();
    expect(semEspacoDuro(faixa.getAttribute('aria-valuetext'))).toBe('R$ 30.000,00');
  });
});

describe('LandingComponent', () => {
  const autenticado = signal(false);

  function criar() {
    TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { autenticado } }],
    });
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => autenticado.set(false));

  it('tem o nome, a frase e as seções principais', () => {
    const { el } = criar();
    expect(el.querySelector('h1')?.textContent).toContain('Rende');
    expect(el.querySelector('h1')?.textContent).toContain('O pedido é seu, o dinheiro também.');
    for (const id of ['como-funciona', 'calculadora', 'modelos', 'preco', 'duvidas']) {
      expect(el.querySelector('#' + id)).not.toBeNull();
    }
    expect(el.querySelector('app-calculadora')).not.toBeNull();
    expect(el.querySelectorAll('.modelo')).toHaveLength(4);
    expect(el.querySelectorAll('details')).toHaveLength(5);
  });

  it('mostra um plano só, com a mensalidade', () => {
    const { el } = criar();
    expect(el.querySelectorAll('.plano')).toHaveLength(1);
    expect(semEspacoDuro(el.querySelector('.plano__valor')?.textContent)).toContain('R$ 129');
  });

  it('chamadas de WhatsApp abrem em nova aba com a mensagem pronta', () => {
    const { el } = criar();
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]'));
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    }
  });

  it('o link do topo vira "Abrir painel" para quem já entrou', () => {
    const { fixture, el } = criar();
    const entrar = () => el.querySelector<HTMLAnchorElement>('.topo__entrar')!;
    expect(entrar().textContent?.trim()).toBe('Entrar');
    expect(entrar().getAttribute('href')).toBe('/entrar');

    autenticado.set(true);
    fixture.detectChanges();
    expect(entrar().textContent?.trim()).toBe('Abrir painel');
    expect(entrar().getAttribute('href')).toBe('/dashboard');
  });

  it('a tabela de receita usa as mesmas taxas do painel', () => {
    const linhas = montarReceita(10_000).map((l) => ({ ...l, liquido: semEspacoDuro(l.liquido) }));
    expect(linhas.map((l) => l.liquido)).toEqual(['R$ 99,01', 'R$ 98,11', 'R$ 96,01', 'R$ 100,00']);
    expect(linhas[0].prazo).toBe('cai na hora');
    expect(linhas[2].prazo).toBe('cai em 30 dias');
    expect(linhas[3].taxa).toBe('sem taxa');
  });

  it('todas as fotos têm texto alternativo ou são decorativas (alt vazio)', () => {
    const { el } = criar();
    for (const img of Array.from(el.querySelectorAll('img'))) {
      expect(img.hasAttribute('alt')).toBe(true);
    }
    expect(el.textContent).toContain('Unsplash');
  });
});
