import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthService } from '../../core/auth/auth.service';
import { formatarMoeda } from '../../core/utils/moeda';
import { RevelarDirective } from '../../shared/movimento/revelar.directive';
import { MENSALIDADE_RENDE_CENTAVOS } from './comparativo';
import { INCLUSO_NO_PLANO, LINK_WHATSAPP, PERGUNTAS } from './conteudo';
import { FatiaComponent } from './fatia/fatia.component';
import { LojasComponent } from './lojas/lojas.component';
import { RolagemService } from './movimento/rolagem.service';
import { PalcoComponent } from './palco/palco.component';

export interface LinkSecao {
  id: string;
  rotulo: string;
}

export const SECOES: LinkSecao[] = [
  { id: 'jornada', rotulo: 'Como funciona' },
  { id: 'fatia', rotulo: 'A fatia do app' },
  { id: 'lojas', rotulo: 'Lojas' },
  { id: 'preco', rotulo: 'Preço' },
  { id: 'duvidas', rotulo: 'Dúvidas' },
];

/**
 * Página pública do Rende ("/"). O painel continua atrás do login.
 * A rolagem suave (Lenis) e o ScrollTrigger nascem aqui e morrem com a página.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, RevelarDirective, PalcoComponent, FatiaComponent, LojasComponent],
  providers: [RolagemService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'aoRolar()' },
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly auth = inject(AuthService);
  private readonly rolagem = inject(RolagemService);

  protected readonly autenticado = this.auth.autenticado;
  protected readonly whatsapp = LINK_WHATSAPP;
  protected readonly secoes = SECOES;
  protected readonly perguntas = PERGUNTAS;
  protected readonly incluso = INCLUSO_NO_PLANO;
  /** Preço redondo para o destaque (R$ 129), sem centavos. */
  protected readonly mensalidade = formatarMoeda(MENSALIDADE_RENDE_CENTAVOS).replace(/,00$/, '');
  protected readonly ano = new Date().getFullYear();

  /** Topo some ao descer e volta ao subir. */
  protected readonly topoEscondido = signal(false);
  private ultimoY = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!this.rolagem.iniciar()) return;
      // fontes e imagens mudam alturas: recalcula os gatilhos quando terminarem de carregar
      const recalcular = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(recalcular);
      window.addEventListener('load', recalcular);
      destroyRef.onDestroy(() => {
        window.removeEventListener('load', recalcular);
        this.rolagem.destruir();
      });
    });
  }

  protected aoRolar() {
    const y = window.scrollY;
    this.topoEscondido.set(y > 400 && y > this.ultimoY);
    this.ultimoY = y;
  }

  /** Links do topo: rola com a mesma suavidade da página (Lenis) em vez de pular. */
  protected irPara(evento: Event, id: string) {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    evento.preventDefault();
    this.rolagem.irPara(alvo);
    history.replaceState(null, '', '#' + id);
  }
}
