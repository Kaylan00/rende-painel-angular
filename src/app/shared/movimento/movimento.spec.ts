import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { animate, inView } from 'motion';
import { ContadorDirective, formatarContador } from './contador.directive';
import { movimentoReduzido } from './movimento';
import { RevelarDirective } from './revelar.directive';

const animateMock = animate as unknown as jest.Mock;
const inViewMock = inView as unknown as jest.Mock;

/** Simula o navegador com (ou sem) "reduzir movimento" ligado. */
function simularPreferencia(reduzir: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches: reduzir }) as unknown as typeof window.matchMedia;
}

@Component({
  imports: [ContadorDirective],
  template: `<span [appContador]="valor()" [contadorFormato]="formato()"></span>`,
})
class HospedeContador {
  valor = signal(36_490);
  formato = signal<'moeda' | 'inteiro'>('moeda');
}

@Component({
  imports: [RevelarDirective],
  template: `<ul appRevelar="filhos"><li>a</li><li>b</li><li>c</li></ul><p appRevelar>sozinho</p>`,
})
class HospedeRevelar {}

describe('movimento (diretivas com motion)', () => {
  const matchMediaOriginal = window.matchMedia;

  beforeEach(() => {
    animateMock.mockClear();
    inViewMock.mockClear();
  });
  afterEach(() => (window.matchMedia = matchMediaOriginal));

  it('formata o contador como dinheiro ou inteiro', () => {
    expect(formatarContador(123_456, 'moeda').replace(/ /g, ' ')).toBe('R$ 1.234,56');
    expect(formatarContador(1234.4, 'inteiro')).toBe('1.234');
  });

  it('sem matchMedia (testes, servidor) considera movimento reduzido', () => {
    // @ts-expect-error simulando ambiente sem matchMedia
    window.matchMedia = undefined;
    expect(movimentoReduzido()).toBe(true);
  });

  it('contador escreve o valor final na hora e não anima com movimento reduzido', () => {
    simularPreferencia(true);
    const fixture = TestBed.createComponent(HospedeContador);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.replace(/ /g, ' ')).toBe('R$ 364,90');
    expect(animateMock).not.toHaveBeenCalled();
  });

  it('contador anima do valor anterior até o novo quando o movimento está liberado', () => {
    simularPreferencia(false);
    const fixture = TestBed.createComponent(HospedeContador);
    fixture.detectChanges();
    expect(animateMock).toHaveBeenLastCalledWith(0, 36_490, expect.objectContaining({ onUpdate: expect.any(Function) }));

    // cada quadro da animação reescreve o texto formatado
    const { onUpdate } = animateMock.mock.calls[0][2];
    onUpdate(1_000);
    expect(fixture.nativeElement.textContent.replace(/ /g, ' ')).toBe('R$ 10,00');

    fixture.componentInstance.valor.set(50_000);
    fixture.detectChanges();
    expect(animateMock).toHaveBeenLastCalledWith(36_490, 50_000, expect.anything());
  });

  it('revelar anima os filhos em sequência quando entram na tela', async () => {
    simularPreferencia(false);
    const fixture = TestBed.createComponent(HospedeRevelar);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(inViewMock).toHaveBeenCalledTimes(2);
    const [alvosLista] = animateMock.mock.calls[0];
    expect(alvosLista).toHaveLength(3);
    expect(animateMock.mock.calls[1][0][0].textContent).toBe('sozinho');
  });

  it('revelar não esconde nada com movimento reduzido', async () => {
    simularPreferencia(true);
    const fixture = TestBed.createComponent(HospedeRevelar);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(inViewMock).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('li')!.style.opacity).toBe('');
  });
});
