import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { animate } from 'motion';
import { movimentoReduzido } from './movimento';

/**
 * Sobe e desce bem devagar, sem parar (os cartões do hero da landing).
 *
 *   <div appFlutuar [flutuarAmplitude]="8" [flutuarDuracao]="6" [flutuarAtraso]="1">
 *
 * Com prefers-reduced-motion fica parado.
 */
@Directive({ selector: '[appFlutuar]' })
export class FlutuarDirective {
  /** Quanto sobe, em px. */
  flutuarAmplitude = input(8);
  /** Duração de um ciclo, em segundos. */
  flutuarDuracao = input(6);
  flutuarAtraso = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (movimentoReduzido()) return;
      const animacao = animate(
        el,
        { y: [0, -this.flutuarAmplitude(), 0] },
        { duration: this.flutuarDuracao(), delay: this.flutuarAtraso(), ease: 'easeInOut', repeat: Infinity },
      );
      destroyRef.onDestroy(() => animacao.stop());
    });
  }
}
