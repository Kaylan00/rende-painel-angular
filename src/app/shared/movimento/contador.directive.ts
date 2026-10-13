import { DestroyRef, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';
import { animate } from 'motion';
import { formatarMoeda } from '../../core/utils/moeda';
import { CURVA_SUAVE, movimentoReduzido } from './movimento';

const formatadorInteiro = new Intl.NumberFormat('pt-BR');

export type FormatoContador = 'moeda' | 'inteiro';

export function formatarContador(valor: number, formato: FormatoContador): string {
  const inteiro = Math.round(valor);
  return formato === 'moeda' ? formatarMoeda(inteiro) : formatadorInteiro.format(inteiro);
}

/**
 * Número que "conta" até o valor final (dinheiro em centavos ou inteiro).
 *
 *   <span [appContador]="dados.vendasHojeCentavos"></span>
 *   <span [appContador]="pedidos" contadorFormato="inteiro"></span>
 *
 * O texto final é escrito na hora (leitor de tela, teste e quem pede menos movimento
 * sempre veem o valor certo); a animação só acontece por cima, com a biblioteca motion.
 * Quando o valor muda (ex.: calculadora), conta a partir do valor anterior.
 */
@Directive({ selector: '[appContador]' })
export class ContadorDirective {
  appContador = input.required<number>();
  contadorFormato = input<FormatoContador>('moeda');
  /** Duração em segundos. */
  contadorDuracao = input(1.2);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private anterior = 0;
  private animacao: { stop: () => void } | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.animacao?.stop());

    effect(() => {
      const valor = this.appContador();
      const formato = this.contadorFormato();
      untracked(() => this.mostrar(valor, formato));
    });
  }

  private mostrar(valor: number, formato: FormatoContador) {
    this.animacao?.stop();
    this.el.textContent = formatarContador(valor, formato);

    if (!movimentoReduzido() && valor !== this.anterior) {
      this.animacao = animate(this.anterior, valor, {
        duration: this.contadorDuracao(),
        ease: CURVA_SUAVE,
        onUpdate: (atual) => (this.el.textContent = formatarContador(atual, formato)),
      });
    }
    this.anterior = valor;
  }
}
