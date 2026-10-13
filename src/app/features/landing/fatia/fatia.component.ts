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
import { formatarMoeda } from '../../../core/utils/moeda';
import { ContadorDirective } from '../../../shared/movimento/contador.directive';
import { movimentoReduzido } from '../../../shared/movimento/movimento';
import { MENSALIDADE_RENDE_CENTAVOS } from '../comparativo';
import { prepararGsap } from '../movimento/rolagem.service';
import { Vapor } from '../palco/vapor';
import {
  calcularFatia,
  COMISSAO_MAX_PCT,
  COMISSAO_MIN_PCT,
  COMISSAO_PADRAO_PCT,
  cortesDaFatia,
  FATURAMENTO_MAX_REAIS,
  FATURAMENTO_MIN_REAIS,
  FATURAMENTO_PADRAO_REAIS,
  pontoNaPizza,
} from './fatia';

/** Folhas de manjericão que caem na pizza (longe da fatia, que sai para cima e à direita). */
const FOLHAS = [
  { angulo: 200, raio: 26, giro: 30 },
  { angulo: 255, raio: 33, giro: -40 },
  { angulo: 150, raio: 31, giro: 110 },
].map((f) => ({ ...pontoNaPizza(f.angulo, f.raio), giro: f.giro }));

/**
 * "A fatia do app": a pizza é o faturamento do mês e a fatia é a comissão.
 * Ao entrar na tela a pizza se monta vista de cima (a massa gira e abre, o molho se espalha
 * em espiral, o manjericão cai), o cortador risca a fatia e ela é puxada até a sacola do app.
 * Os sliders escrevem em signals; ângulo, tamanho e valores são `computed`.
 * "Com o Rende" devolve a fatia para a pizza.
 */
@Component({
  selector: 'app-fatia',
  imports: [ContadorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fatia.component.html',
  styleUrl: './fatia.component.scss',
})
export class FatiaComponent {
  private readonly pizza = viewChild.required<ElementRef<HTMLElement>>('pizza');
  private readonly corpo = viewChild.required<ElementRef<HTMLElement>>('corpo');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('vapor');

  protected readonly faturamentoMin = FATURAMENTO_MIN_REAIS;
  protected readonly faturamentoMax = FATURAMENTO_MAX_REAIS;
  protected readonly comissaoMin = COMISSAO_MIN_PCT;
  protected readonly comissaoMax = COMISSAO_MAX_PCT;
  protected readonly mensalidade = formatarMoeda(MENSALIDADE_RENDE_CENTAVOS);
  protected readonly folhas = FOLHAS;

  readonly faturamentoReais = signal(FATURAMENTO_PADRAO_REAIS);
  readonly comissaoPct = signal(COMISSAO_PADRAO_PCT);
  /** true = cenário com o Rende (a fatia volta para a pizza). */
  readonly comRende = signal(false);
  /** A fatia só é puxada depois do corte (sem movimento, já começa na sacola). */
  protected readonly entrou = signal(true);

  readonly fatia = computed(() => calcularFatia(this.faturamentoReais(), this.comissaoPct()));
  protected readonly cortes = computed(() => cortesDaFatia(this.fatia().graus));
  /** A fatia fica fora da pizza enquanto o cenário é o do app. */
  protected readonly fatiaFora = computed(() => this.entrou() && !this.comRende());
  protected readonly faturamentoTexto = computed(() => formatarMoeda(this.faturamentoReais() * 100));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (movimentoReduzido()) return;
      const desligar = this.prepararMontagem();
      destroyRef.onDestroy(desligar);
    });
  }

  protected mudarFaturamento(evento: Event) {
    this.faturamentoReais.set(Number((evento.target as HTMLInputElement).value));
  }

  protected mudarComissao(evento: Event) {
    this.comissaoPct.set(Number((evento.target as HTMLInputElement).value));
  }

  protected alternar() {
    this.entrou.set(true);
    this.comRende.update((v) => !v);
  }

  protected formatar(centavos: number): string {
    return formatarMoeda(centavos);
  }

  /** Deixa a pizza "desmontada" e monta quando a seção aparece (uma vez só). */
  private prepararMontagem(): () => void {
    prepararGsap();
    this.entrou.set(false);
    const pizza = this.pizza().nativeElement;
    const corpo = this.corpo().nativeElement;
    let vapor: Vapor | null = null;
    let tl: gsap.core.Timeline | null = null;

    const ctx = gsap.context(() => {
      pizza.classList.add('pizza--montando');
      gsap.set('.pizza__massa', { scale: 0.32, rotation: -220, opacity: 0 });
      gsap.set('.pizza__cobertura', { '--varre': '0deg', '--raio': '0%' });
      gsap.set('.folha', { opacity: 0, y: -90, scale: 2.2 });
      gsap.set('.pizza__cortes path', { strokeDashoffset: 1 });
      gsap.set('.cortador', { opacity: 0 });
      gsap.set(['.sacola', '.sacola__rotulo'], { opacity: 0, y: -30 });

      tl = gsap.timeline({ paused: true });
      // 1) a massa gira e se abre
      tl.to('.pizza__massa', { scale: 1, rotation: 0, opacity: 1, duration: 1.1, ease: 'expo.out' });
      // 2) molho e queijo se espalham em espiral (máscara cônica + radial crescendo juntas)
      tl.to('.pizza__cobertura', { '--varre': '360deg', duration: 1.3, ease: 'power2.inOut' }, 0.55);
      tl.to('.pizza__cobertura', { '--raio': '72%', duration: 1.3, ease: 'power1.in' }, 0.55);
      tl.to('.pizza__cobertura', { '--raio': '110%', duration: 0.35, ease: 'power2.out' }, 1.85);
      tl.call(() => pizza.classList.remove('pizza--montando'), [], 2.2);
      tl.set('.pizza__massa', { opacity: 0 }, 2.2);
      // forno: um calor rápido quando assa
      tl.fromTo(corpo, { filter: 'brightness(1)' }, { filter: 'brightness(1.22)', duration: 0.18, yoyo: true, repeat: 1 }, 2.05);
      // 3) manjericão cai e quica
      tl.to('.folha', { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'bounce.out', stagger: 0.12 }, 2.2);
      tl.call(() => {
        vapor = new Vapor(this.canvas().nativeElement);
        vapor.origem = { x: 0.45, y: 0.62, espalho: 0.5 };
      }, [], 2.3);
      // 4) o cortador risca as duas linhas da fatia
      const tamanho = () => corpo.offsetWidth;
      const pos = (p: { x: number; y: number }) => ({ x: (p.x / 100) * tamanho(), y: (p.y / 100) * tamanho() });
      const [a, b] = this.cortes();
      const fora = (p: { x: number; y: number }) => pos({ x: 50 + (p.x - 50) * 1.22, y: 50 + (p.y - 50) * 1.22 });
      const giro = (de: { x: number; y: number }, para: { x: number; y: number }) =>
        (Math.atan2(para.y - de.y, para.x - de.x) * 180) / Math.PI + 180 - 132;
      const centro = pos({ x: 50, y: 50 });
      tl.set('.cortador', { x: fora(a).x, y: fora(a).y, rotation: giro(fora(a), centro), opacity: 1 }, 2.9);
      tl.to('.cortador', { x: centro.x, y: centro.y, duration: 0.7, ease: 'power2.inOut' }, 2.95);
      tl.to('.pizza__cortes path:first-child', { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 3.0);
      tl.to('.cortador', { rotation: giro(centro, fora(b)), duration: 0.2 }, 3.65);
      tl.to('.cortador', { x: fora(b).x, y: fora(b).y, duration: 0.7, ease: 'power2.inOut' }, 3.85);
      tl.to('.pizza__cortes path:last-child', { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 3.9);
      tl.to('.cortador', { opacity: 0, x: '+=60', y: '-=40', duration: 0.4 }, 4.55);
      // 5) a sacola do app chega e a fatia é puxada até ela
      tl.to(['.sacola', '.sacola__rotulo'], { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05 }, 4.4);
      tl.call(() => this.entrou.set(true), [], 4.7);
    }, pizza);

    const gatilho = ScrollTrigger.create({
      trigger: pizza,
      start: 'top 70%',
      once: true,
      onEnter: () => tl?.play(),
    });

    return () => {
      gatilho.kill();
      vapor?.destruir();
      ctx.revert();
    };
  }
}
