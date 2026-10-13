import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { calcularLiquido } from '../../../core/models/pedido.model';
import { formatarMoeda } from '../../../core/utils/moeda';
import { ContadorDirective } from '../../../shared/movimento/contador.directive';
import { QrPlaceholderComponent } from '../../../shared/ui/qr-placeholder.component';
import { movimentoReduzido } from '../../../shared/movimento/movimento';
import { prepararGsap } from '../movimento/rolagem.service';
import { CAMADAS, Camada, centroMontado, JORNADA, PASSO_POR_CAMADA, PEDIDO_EXEMPLO, Pose, STATUS_CARTAO, statusDoPasso } from './camadas';
import { Vapor } from './vapor';

/** Quando cada camada começa a descer (em "tempo" da timeline de rolagem). */
const INICIO_DESCIDA = 0.7;
const INTERVALO = 0.9;
const DURACAO_DESCIDA = 1;

/**
 * Topo da landing + montagem do hambúrguer.
 *
 * Sem JavaScript ou com prefers-reduced-motion: o hambúrguer fica "explodido" no topo e
 * a jornada do pedido aparece logo abaixo, parada (nada some).
 * Com movimento: a seção fica presa (pin do ScrollTrigger) e, ao rolar, as camadas descem
 * uma a uma; cada camada que assenta acende um passo da jornada.
 */
@Component({
  selector: 'app-palco',
  imports: [RouterLink, QrPlaceholderComponent, ContadorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './palco.component.html',
  styleUrl: './palco.component.scss',
})
export class PalcoComponent {
  readonly whatsapp = input.required<string>();

  private readonly secao = viewChild.required<ElementRef<HTMLElement>>('secao');
  private readonly hamburguer = viewChild.required<ElementRef<HTMLElement>>('hamburguer');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('vapor');
  private readonly camadasEl = viewChildren<ElementRef<HTMLElement>>('camada');

  protected readonly camadas = CAMADAS;
  protected readonly jornada = JORNADA;
  protected readonly pedido = PEDIDO_EXEMPLO;
  protected readonly statusCartao = STATUS_CARTAO;
  protected readonly letras = 'Rende'.split('');
  protected readonly totalPedido = formatarMoeda(PEDIDO_EXEMPLO.totalCentavos);
  protected readonly liquidoPix = formatarMoeda(calcularLiquido(PEDIDO_EXEMPLO.totalCentavos, 'pix').liquidoCentavos);

  /** true quando a versão com rolagem (pin) está ligada. */
  protected readonly vivo = signal(false);
  /** Passo atual da jornada (1 a 5). Sem movimento fica no 5: tudo à mostra. */
  readonly passo = signal(5);
  protected readonly statusAceso = computed(() => statusDoPasso(this.passo()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (movimentoReduzido()) return;
      const desligar = this.ligarMovimento();
      destroyRef.onDestroy(desligar);
    });
  }

  /** Estilo da camada: posição montada + pose explodida (variáveis lidas pelo CSS). */
  protected estilo(c: Camada): Record<string, string | number> {
    return {
      '--largura': c.largura,
      '--topo': c.topo,
      '--proporcao': c.proporcao,
      '--balanco': c.balanco + 'deg',
      '--duracao': 5 + c.profundidade * 1.7 + 's',
      '--x-pc': c.pc.x,
      '--y-pc': c.pc.y,
      '--giro-pc': c.pc.giro + 'deg',
      '--escala-pc': c.pc.escala,
      '--x-cel': c.cel.x,
      '--y-cel': c.cel.y,
      '--giro-cel': c.cel.giro + 'deg',
      '--escala-cel': c.cel.escala,
    };
  }

  protected altura(c: Camada): number {
    return Math.round(840 * c.proporcao);
  }

  private ligarMovimento(): () => void {
    prepararGsap();
    this.vivo.set(true);
    this.passo.set(0);

    const secao = this.secao().nativeElement;
    const hamburguer = this.hamburguer().nativeElement;
    const camadas = this.camadasEl().map((r) => r.nativeElement);
    const celular = () => window.innerWidth < 768;
    const L = () => hamburguer.offsetWidth;
    const pose = (c: Camada): Pose => (celular() ? c.cel : c.pc);
    const vapor = new Vapor(this.canvas().nativeElement);
    let parallax: (() => void) | null = null;

    const ctx = gsap.context(() => {
      // ---------- entrada (primeiro segundo): o hambúrguer "explode" e o nome sobe ----------
      if (window.scrollY < 40) {
        gsap.from(secao.querySelectorAll('.letra'), {
          yPercent: 105,
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.07,
          delay: 0.1,
        });
        camadas.forEach((el, i) => {
          const p = pose(CAMADAS[i]);
          gsap.from(el.querySelector('.camada__entrada'), {
            x: () => -p.x * L(),
            y: () => -p.y * L(),
            rotation: -p.giro,
            scale: 0.92,
            duration: 1.5,
            delay: 0.25 + i * 0.03,
            ease: 'expo.out',
          });
        });
        gsap.from(secao.querySelectorAll('.palco__frase, .palco__apoio, .palco__acoes'), {
          y: 24,
          opacity: 0,
          duration: 1,
          delay: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
        });
      }

      // ---------- rolagem: monta o hambúrguer (pin) ----------
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: secao,
          start: 'top top',
          end: () => (celular() ? '+=340%' : '+=520%'),
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1) o topo sai, o nome apaga e vira fundo, o hambúrguer vai para o lado da jornada
      tl.fromTo(
        secao.querySelectorAll('.palco__frase, .palco__apoio, .palco__acoes'),
        { opacity: 1, y: 0 },
        { opacity: 0, y: -40, duration: 0.5, stagger: 0.05 },
        0,
      );
      tl.fromTo('.palco__nome', { opacity: 1, scale: 1 }, { opacity: 0.08, scale: 0.86, duration: 0.9, ease: 'power1.inOut' }, 0);
      // o hambúrguer anda por variáveis CSS (--bx/--by), lidas por cada camada, e não por transform
      // no contêiner: assim as camadas continuam podendo passar na frente e atrás do nome
      tl.fromTo(
        hamburguer,
        { '--bx': '0px', '--by': '0px' },
        {
          '--bx': () => (celular() ? '0px' : -window.innerWidth * 0.17 + 'px'),
          '--by': () => (celular() ? -window.innerHeight * 0.13 + 'px' : window.innerHeight * 0.04 + 'px'),
          duration: 1,
          ease: 'power2.inOut',
        },
        0,
      );
      tl.fromTo(secao, { '--solto': 1 }, { '--solto': 0.25, duration: 1 }, 0);
      tl.fromTo('.jornada', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.55);

      // 2) cada camada sai da pose explodida, espera ao lado do hambúrguer e assenta
      camadas.forEach((el, i) => {
        const c = CAMADAS[i];
        const alvo = el.querySelector('.camada__pose');
        const inicio = INICIO_DESCIDA + i * INTERVALO;
        // espera: o ponto é o CENTRO da camada (em L, a partir do centro do hambúrguer)
        const espera = () => (celular() ? c.esperaCel : c.espera);
        const meio = centroMontado(c);
        tl.fromTo(
          alvo,
          {
            x: () => pose(c).x * L(),
            y: () => pose(c).y * L(),
            rotation: () => pose(c).giro,
            scale: () => pose(c).escala,
          },
          {
            x: () => espera().x * L(),
            y: () => (espera().y - meio) * L(),
            rotation: () => espera().giro,
            scale: () => (celular() ? 0.8 : 0.74),
            duration: inicio,
            ease: 'power2.inOut',
          },
          0,
        );
        tl.fromTo(el, { zIndex: c.naFrente ? 4 : 1 }, { zIndex: 10 + i, duration: 0.01 }, 0.3);
        tl.to(alvo, { x: 0, y: 0, rotation: 0, scale: 1, duration: DURACAO_DESCIDA, ease: 'power3.in' }, inicio);
        // "assentou": pequeno achatamento e volta
        tl.to(alvo, { scaleY: 0.94, duration: 0.08, ease: 'power1.out' }, inicio + DURACAO_DESCIDA);
        tl.to(alvo, { scaleY: 1, duration: 0.18, ease: 'power2.out' }, inicio + DURACAO_DESCIDA + 0.08);
      });

      const fim = INICIO_DESCIDA + (CAMADAS.length - 1) * INTERVALO + DURACAO_DESCIDA;
      tl.fromTo(secao, { '--solto': 0.25 }, { '--solto': 0, duration: 1 }, fim - 1);
      tl.fromTo('.palco__fim', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5 }, fim + 0.2);
      tl.to({}, { duration: 0.6 }, fim + 0.7); // segura o hambúrguer montado um pouco
      // a frase final sai antes do pin soltar: assim ela nunca sobe por baixo do topo fixo
      tl.to('.palco__fim', { autoAlpha: 0, y: -24, duration: 0.35 }, fim + 1.3);

      // passo atual = quantas camadas já assentaram (lido do tempo da timeline)
      const marcos = CAMADAS.map((_, i) => INICIO_DESCIDA + i * INTERVALO + DURACAO_DESCIDA * 0.92);
      // onde o link "Como funciona" deve parar: logo depois que a 1ª camada assenta (fração do pin)
      secao.dataset['inicioJornada'] = String((marcos[0] + 0.15) / tl.duration());
      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        let passo = 0;
        marcos.forEach((m, i) => {
          if (t >= m) passo = PASSO_POR_CAMADA[i];
        });
        if (passo !== this.passo()) this.passo.set(passo);
        const caixa = camadas[1].getBoundingClientRect();
        vapor.origem = {
          x: (caixa.left + caixa.width / 2) / window.innerWidth,
          y: (caixa.top + caixa.height * 0.55) / window.innerHeight,
          espalho: (caixa.width / window.innerWidth) * 0.7,
        };
        vapor.intensidade = Math.max(0.35, 1 - tl.progress() * 0.8);
      });

      // ---------- mouse: cada camada numa profundidade (só com mouse de verdade) ----------
      if (window.matchMedia('(pointer: fine)').matches) {
        const movers = camadas.map((el, i) => {
          const alvo = el.querySelector('.camada__mouse');
          return {
            x: gsap.quickTo(alvo, 'x', { duration: 0.9, ease: 'power3.out' }),
            y: gsap.quickTo(alvo, 'y', { duration: 0.9, ease: 'power3.out' }),
            fator: CAMADAS[i].profundidade * 26,
          };
        });
        const nomeX = gsap.quickTo(secao.querySelector('.palco__nome'), 'x', { duration: 1.2, ease: 'power3.out' });
        const aoMover = (e: PointerEvent) => {
          const dx = e.clientX / window.innerWidth - 0.5;
          const dy = e.clientY / window.innerHeight - 0.5;
          for (const m of movers) {
            m.x(dx * m.fator);
            m.y(dy * m.fator);
          }
          nomeX(-dx * 14);
        };
        window.addEventListener('pointermove', aoMover, { passive: true });
        parallax = () => window.removeEventListener('pointermove', aoMover);
      }
    }, secao);

    return () => {
      parallax?.();
      vapor.destruir();
      ctx.revert();
    };
  }
}
