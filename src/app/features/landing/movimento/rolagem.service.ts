import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { movimentoReduzido } from '../../../shared/movimento/movimento';

let pluginRegistrado = false;

/** Registra o ScrollTrigger uma vez só (pode ser chamado por qualquer seção). */
export function prepararGsap(): void {
  if (pluginRegistrado) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  pluginRegistrado = true;
}

/**
 * Rolagem suave da landing (Lenis) ligada ao relógio do GSAP, para o ScrollTrigger
 * ler a mesma posição que a tela mostra.
 *
 * Fica nos `providers` da LandingComponent (não é global): nasce com a landing e
 * morre com ela, então o painel nunca roda com Lenis nem com ScrollTrigger sobrando.
 */
@Injectable()
export class RolagemService {
  private lenis: Lenis | null = null;
  private readonly aoTicar = (segundos: number) => this.lenis?.raf(segundos * 1000);

  /** true quando o movimento está liberado (sem prefers-reduced-motion) e a rolagem suave ligou. */
  get ativa(): boolean {
    return this.lenis !== null;
  }

  iniciar(): boolean {
    if (this.lenis || movimentoReduzido()) return false;
    prepararGsap();
    this.lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.aoTicar);
    gsap.ticker.lagSmoothing(0);
    return true;
  }

  /** Rola até uma seção (links do topo). Sem Lenis, usa a rolagem do navegador. */
  irPara(alvo: HTMLElement): void {
    if (this.lenis) this.lenis.scrollTo(alvo, { offset: 0, duration: 1.4 });
    else alvo.scrollIntoView({ behavior: movimentoReduzido() ? 'auto' : 'smooth' });
  }

  destruir(): void {
    gsap.ticker.remove(this.aoTicar);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
