import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { movimentoReduzido } from '../../../shared/movimento/movimento';
import { MODELOS } from '../conteudo';
import { prepararGsap } from '../movimento/rolagem.service';

/** Ângulo entre um celular e o próximo no anel. */
export const PASSO_ANEL = 360 / MODELOS.length;

/** Qual loja está de frente para quem olha, dado o giro do anel (em graus). */
export function lojaDeFrente(giro: number, total = MODELOS.length): number {
  const passo = 360 / total;
  const indice = Math.round(-giro / passo) % total;
  return (indice + total) % total;
}

/**
 * As 4 lojas de exemplo, cada uma num celular, presas num anel 3D (CSS transforms).
 * O anel gira com a rolagem (ScrollTrigger) e com o arrastar (mouse ou dedo).
 * Sem movimento, os celulares ficam lado a lado, parados.
 */
@Component({
  selector: 'app-lojas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lojas.component.html',
  styleUrl: './lojas.component.scss',
})
export class LojasComponent {
  private readonly secao = viewChild.required<ElementRef<HTMLElement>>('secao');
  private readonly anel = viewChild.required<ElementRef<HTMLElement>>('anel');
  private readonly cena = viewChild.required<ElementRef<HTMLElement>>('cena');

  protected readonly modelos = MODELOS;
  protected readonly passoAnel = PASSO_ANEL;
  protected readonly vivo = signal(false);
  protected readonly frente = signal(0);
  protected readonly lojaAtual = computed(() => this.modelos[this.frente()]);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (movimentoReduzido()) return;
      const desligar = this.ligar();
      destroyRef.onDestroy(desligar);
    });
  }

  /** Endereço de exemplo da loja: "Padaria Dona Lia" -> "padariadonalia.rende.app". */
  protected endereco(nome: string): string {
    return (
      nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9]/g, '') + '.rende.app'
    );
  }

  private ligar(): () => void {
    prepararGsap();
    this.vivo.set(true);

    const anel = this.anel().nativeElement;
    const cena = this.cena().nativeElement;
    const estado = { rolagem: 0, arrasto: 0 };

    const aplicar = () => {
      const giro = estado.rolagem + estado.arrasto;
      anel.style.setProperty('--giro', giro + 'deg');
      const frente = lojaDeFrente(giro);
      if (frente !== this.frente()) this.frente.set(frente);
    };

    // rolagem: 3/4 de volta enquanto a seção passa (mostra as 4 lojas)
    const gatilho = ScrollTrigger.create({
      trigger: this.secao().nativeElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (st) => {
        estado.rolagem = -st.progress * PASSO_ANEL * (MODELOS.length - 1);
        aplicar();
      },
    });

    // arrastar: gira junto com o dedo/mouse e, ao soltar, encaixa no celular mais próximo
    let inicioX = 0;
    let base = 0;
    let arrastando = false;
    const soltar = () => {
      if (!arrastando) return;
      arrastando = false;
      cena.classList.remove('arrastando');
      const total = estado.rolagem + estado.arrasto;
      const alvo = Math.round(total / PASSO_ANEL) * PASSO_ANEL - estado.rolagem;
      gsap.to(estado, { arrasto: alvo, duration: 0.7, ease: 'power3.out', onUpdate: aplicar });
    };
    const aoApertar = (e: PointerEvent) => {
      arrastando = true;
      inicioX = e.clientX;
      base = estado.arrasto;
      gsap.killTweensOf(estado);
      cena.classList.add('arrastando');
    };
    const aoMover = (e: PointerEvent) => {
      if (!arrastando) return;
      estado.arrasto = base + (e.clientX - inicioX) * 0.35;
      aplicar();
    };
    cena.addEventListener('pointerdown', aoApertar);
    window.addEventListener('pointermove', aoMover, { passive: true });
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    aplicar();

    return () => {
      gatilho.kill();
      gsap.killTweensOf(estado);
      cena.removeEventListener('pointerdown', aoApertar);
      window.removeEventListener('pointermove', aoMover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }
}
