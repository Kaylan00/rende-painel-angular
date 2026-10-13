import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { animate, inView, stagger } from 'motion';
import { CURVA_SUAVE, movimentoReduzido } from './movimento';

/**
 * Faz o elemento entrar (sobe um pouco e aparece) quando chega na tela.
 *
 *   <section appRevelar>...</section>                 o próprio elemento
 *   <ul appRevelar="filhos">...</ul>                   os filhos, um depois do outro (stagger)
 *   <div appRevelar [revelarAtraso]="0.2">...</div>    com atraso em segundos
 *
 * Usa `inView` da biblioteca motion (IntersectionObserver por baixo) e roda uma vez só.
 * Com prefers-reduced-motion o conteúdo aparece direto, sem animação.
 */
@Directive({ selector: '[appRevelar]' })
export class RevelarDirective {
  appRevelar = input<'' | 'filhos'>('');
  revelarAtraso = input(0);
  revelarDistancia = input(24);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender: só mexe no DOM depois que o Angular desenhou (e nunca no servidor)
    afterNextRender(() => {
      if (movimentoReduzido()) return;

      const alvos = this.appRevelar() === 'filhos' ? (Array.from(this.el.children) as HTMLElement[]) : [this.el];
      if (alvos.length === 0) return;

      const distancia = this.revelarDistancia();
      for (const alvo of alvos) {
        alvo.style.opacity = '0';
        alvo.style.transform = `translateY(${distancia}px)`;
      }

      const parar = inView(
        this.el,
        () => {
          animate(
            alvos,
            { opacity: 1, transform: 'translateY(0px)' },
            { duration: 0.8, ease: CURVA_SUAVE, delay: stagger(0.08, { startDelay: this.revelarAtraso() }) },
          );
        },
        { amount: 0.15 },
      );
      destroyRef.onDestroy(() => parar());
    });
  }
}
