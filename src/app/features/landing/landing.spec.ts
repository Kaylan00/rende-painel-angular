import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthService } from '../../core/auth/auth.service';
import { compararCustos, COMISSAO_APP_BPS, MENSALIDADE_RENDE_CENTAVOS } from './comparativo';
import { calcularFatia, FATURAMENTO_MAX_REAIS, FATURAMENTO_MIN_REAIS } from './fatia/fatia';
import { FatiaComponent } from './fatia/fatia.component';
import { LandingComponent, posicaoDaJornada } from './landing.component';
import { lojaDeFrente, LojasComponent } from './lojas/lojas.component';
import { RolagemService } from './movimento/rolagem.service';
import { CAMADAS, centroMontado, JORNADA, PASSO_POR_CAMADA, statusDoPasso } from './palco/camadas';
import { PalcoComponent } from './palco/palco.component';

const semEspacoDuro = (texto: string | null | undefined) => (texto ?? '').replace(/\u00a0/g, ' ');

/** Simula o navegador com (ou sem) "reduzir movimento" ligado. */
function simularPreferencia(reduzir: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches: reduzir }) as unknown as typeof window.matchMedia;
}

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

describe('calcularFatia (a fatia do app na pizza)', () => {
  it('27% vira uma fatia de 97,2 graus e usa os mesmos valores do comparativo', () => {
    const f = calcularFatia(30_000, 27);
    expect(f.graus).toBe(97.2);
    expect(f.comissaoAppCentavos).toBe(810_000);
    expect(f.sobraAppCentavos).toBe(2_190_000);
    expect(f.diferencaMesCentavos).toBe(810_000 - MENSALIDADE_RENDE_CENTAVOS);
    expect(f.diferencaAnoCentavos).toBe(f.diferencaMesCentavos * 12);
    expect(f.rendeCompensa).toBe(true);
  });

  it('o ângulo acompanha a comissão (10% = 36°, 30% = 108°)', () => {
    expect(calcularFatia(30_000, 10).graus).toBe(36);
    expect(calcularFatia(30_000, 30).graus).toBe(108);
  });

  it('a pizza cresce com o faturamento, de 0,78 a 1, sem passar dos limites', () => {
    expect(calcularFatia(FATURAMENTO_MIN_REAIS, 27).escala).toBe(0.78);
    expect(calcularFatia(FATURAMENTO_MAX_REAIS, 27).escala).toBe(1);
    expect(calcularFatia(500, 27).escala).toBe(0.78);
    expect(calcularFatia(999_999, 27).faturamentoCentavos).toBe(FATURAMENTO_MAX_REAIS * 100);
    const meio = calcularFatia(61_000, 27).escala;
    expect(meio).toBeGreaterThan(0.78);
    expect(meio).toBeLessThan(1);
  });

  it('com faturamento baixo a mensalidade não compensa', () => {
    const f = calcularFatia(400, 10); // app leva R$ 40, mensalidade é R$ 129
    expect(f.rendeCompensa).toBe(false);
    expect(f.diferencaMesCentavos).toBeLessThan(0);
  });
});

describe('FatiaComponent', () => {
  beforeEach(() => simularPreferencia(true));

  function criar() {
    const fixture = TestBed.createComponent(FatiaComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function mover(el: HTMLElement, seletor: string, valor: number) {
    const faixa = el.querySelector<HTMLInputElement>(seletor)!;
    faixa.value = String(valor);
    faixa.dispatchEvent(new Event('input'));
  }

  it('mostra o cenário padrão (R$ 30 mil, 27%) com a fatia fora da pizza', () => {
    const { el } = criar();
    const texto = semEspacoDuro(el.textContent);
    expect(texto).toContain('27%');
    expect(texto).toContain('R$ 8.100,00'); // o app leva
    expect(texto).toContain('R$ 21.900,00'); // fica com a loja
    const pizza = el.querySelector<HTMLElement>('.pizza')!;
    expect(pizza.classList).toContain('pizza--fora');
    expect(pizza.style.getPropertyValue('--ang')).toBe('97.2deg');
  });

  it('os sliders mudam a fatia e os valores ao vivo (computed)', () => {
    const { fixture, el } = criar();
    mover(el, '#faturamento', 10_000);
    mover(el, '#comissao', 12);
    fixture.detectChanges();

    const texto = semEspacoDuro(el.textContent);
    expect(texto).toContain('R$ 10.000,00');
    expect(texto).toContain('12% por pedido');
    expect(texto).toContain('R$ 1.200,00');
    expect(el.querySelector<HTMLElement>('.pizza')!.style.getPropertyValue('--ang')).toBe('43.2deg');
  });

  it('"Com o Rende" devolve a fatia e mostra quanto sobra a mais por mês e por ano', () => {
    const { fixture, el } = criar();
    const botao = el.querySelector<HTMLButtonElement>('.alternar')!;
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    botao.click();
    fixture.detectChanges();

    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('.pizza')!.classList).not.toContain('pizza--fora');
    expect(semEspacoDuro(el.querySelector('.ganho__mes')?.textContent)).toBe('R$ 7.971,00');
    expect(semEspacoDuro(el.querySelector('.ganho__ano')?.textContent)).toBe('R$ 95.652,00');
    expect(semEspacoDuro(el.querySelector('[aria-live]')?.textContent)).toContain('R$ 7.971,00 a mais por mês');
  });

  it('as faixas têm rótulo e valor falado para leitor de tela', () => {
    const { el } = criar();
    const faixa = el.querySelector<HTMLInputElement>('#faturamento')!;
    expect(el.querySelector('label[for=faturamento]')).not.toBeNull();
    expect(semEspacoDuro(faixa.getAttribute('aria-valuetext'))).toBe('R$ 30.000,00');
  });
});

describe('palco: camadas e jornada', () => {
  it('são 6 camadas, de baixo para cima, e o hambúrguer montado não tem buraco', () => {
    expect(CAMADAS.map((c) => c.id)).toEqual(['pao-baixo', 'carne', 'queijo', 'tomate', 'alface', 'pao-cima']);
    // cada camada começa acima (ou junto) da de baixo
    for (let i = 1; i < CAMADAS.length; i++) expect(CAMADAS[i].topo).toBeLessThan(CAMADAS[i - 1].topo);
    expect(centroMontado(CAMADAS[0])).toBeGreaterThan(centroMontado(CAMADAS[5]));
  });

  it('cada passo da jornada aparece quando uma camada assenta, do 1 ao 5', () => {
    expect(PASSO_POR_CAMADA).toHaveLength(CAMADAS.length);
    expect(PASSO_POR_CAMADA[0]).toBe(1);
    expect(PASSO_POR_CAMADA.at(-1)).toBe(JORNADA.length);
    expect([...PASSO_POR_CAMADA].sort((a, b) => a - b)).toEqual(PASSO_POR_CAMADA);
  });

  it('o cartão do painel acende o status certo em cada passo', () => {
    expect([0, 1, 2, 3, 4, 5].map(statusDoPasso)).toEqual([0, 0, 1, 2, 3, 4]);
  });
});

describe('posicaoDaJornada (link "Como funciona")', () => {
  it('sem pin usa a própria seção; com pin para logo depois da 1ª camada', () => {
    document.body.innerHTML =
      '<div class="pin-spacer" style="height:5000px"><section class="palco" data-inicio-jornada="0.25"><div id="jornada"></div></section></div>';
    const espaco = document.querySelector<HTMLElement>('.pin-spacer')!;
    Object.defineProperty(espaco, 'offsetHeight', { value: 5000 });
    const alvo = document.getElementById('jornada')!;
    expect(posicaoDaJornada('fatia', alvo)).toBeNull();
    expect(posicaoDaJornada('jornada', alvo)).toBe(Math.round((5000 - window.innerHeight) * 0.25));
    espaco.classList.remove('pin-spacer');
    expect(posicaoDaJornada('jornada', alvo)).toBeNull();
    document.body.innerHTML = '';
  });
});

describe('lojaDeFrente (anel 3D das lojas)', () => {
  it('descobre qual celular está de frente pelo giro do anel', () => {
    expect(lojaDeFrente(0)).toBe(0);
    expect(lojaDeFrente(-90)).toBe(1);
    expect(lojaDeFrente(-185)).toBe(2);
    expect(lojaDeFrente(-270)).toBe(3);
    expect(lojaDeFrente(90)).toBe(3); // girando ao contrário
    expect(lojaDeFrente(-360)).toBe(0);
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

  beforeEach(() => {
    autenticado.set(false);
    simularPreferencia(true);
    jest.clearAllMocks();
  });

  it('tem o nome, a frase e as seções principais', () => {
    const { el } = criar();
    expect(el.querySelector('h1')?.textContent).toContain('Rende');
    expect(el.querySelector('h1')?.textContent).toContain('O pedido é seu, o dinheiro também.');
    for (const id of ['jornada', 'fatia', 'lojas', 'preco', 'duvidas']) {
      expect(el.querySelector('#' + id)).not.toBeNull();
    }
    expect(el.querySelectorAll('.camada')).toHaveLength(6);
    expect(el.querySelectorAll('.passo')).toHaveLength(5);
    expect(el.querySelectorAll('.celular')).toHaveLength(4);
    expect(el.querySelectorAll('details')).toHaveLength(5);
  });

  it('as lojas dos celulares são HTML de verdade (nome, itens e preço)', () => {
    const { el } = criar();
    const primeira = el.querySelector('.celular')!;
    expect(primeira.querySelector('h3')?.textContent).toBe('Bocca Burger');
    expect(primeira.querySelectorAll('.tela__itens li').length).toBeGreaterThanOrEqual(3);
    expect(semEspacoDuro(primeira.textContent)).toContain('R$ 41,90');
    expect(primeira.textContent).toContain('boccaburger.rende.app');
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

  it('todas as imagens têm texto alternativo ou são decorativas, e o rodapé não tem créditos de foto', () => {
    const { el } = criar();
    for (const img of Array.from(el.querySelectorAll('img'))) {
      expect(img.hasAttribute('alt')).toBe(true);
    }
    expect(el.querySelector('.rodape')?.textContent).not.toContain('Unsplash');
  });

  it('com movimento reduzido nada é preso nem escondido: sem Lenis, sem pin, jornada inteira à mostra', async () => {
    const { fixture, el } = criar();
    await fixture.whenStable();
    expect(gsap.timeline).not.toHaveBeenCalled();
    expect(ScrollTrigger.create).not.toHaveBeenCalled();
    expect(el.querySelector('.palco')!.classList).not.toContain('palco--vivo');
    // passo 5 = cartão do painel e Pix à mostra
    expect(el.querySelector('.jornada__tela')!.getAttribute('data-passo')).toBe('5');
  });
});

describe('versão com movimento (GSAP e Lenis mockados)', () => {
  beforeEach(() => {
    simularPreferencia(false);
    jest.clearAllMocks();
    // o jsdom não desenha em canvas: o vapor recebe "sem contexto" e simplesmente não desenha
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({ providers: [provideRouter([]), RolagemService] });
  });

  it('o palco liga o pin, começa no passo 0 e desfaz tudo ao ser destruído', async () => {
    const reverter = jest.fn();
    (gsap.context as jest.Mock).mockImplementationOnce((fn: () => void) => {
      fn();
      return { revert: reverter };
    });
    const fixture = TestBed.createComponent(PalcoComponent);
    fixture.componentRef.setInput('whatsapp', 'https://wa.me/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const opcoes = (gsap.timeline as jest.Mock).mock.calls[0][0];
    expect(opcoes.scrollTrigger).toEqual(expect.objectContaining({ pin: true, scrub: expect.any(Number) }));
    expect(fixture.componentInstance.passo()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('.palco')!.classList).toContain('palco--vivo');

    fixture.destroy();
    expect(reverter).toHaveBeenCalled();
  });

  it('o anel das lojas cria o gatilho de rolagem e o mata ao sair', async () => {
    const matar = jest.fn();
    (ScrollTrigger.create as jest.Mock).mockReturnValueOnce({ kill: matar });
    const fixture = TestBed.createComponent(LojasComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ScrollTrigger.create).toHaveBeenCalledWith(expect.objectContaining({ scrub: expect.any(Number) }));
    fixture.destroy();
    expect(matar).toHaveBeenCalled();
  });

  it('a rolagem suave liga o Lenis no relógio do GSAP e desliga sem sobrar nada', () => {
    const rolagem = TestBed.inject(RolagemService);
    expect(rolagem.iniciar()).toBe(true);
    expect(rolagem.ativa).toBe(true);
    expect(gsap.ticker.add).toHaveBeenCalled();
    rolagem.destruir();
    expect(gsap.ticker.remove).toHaveBeenCalled();
    expect(rolagem.ativa).toBe(false);
  });
});
