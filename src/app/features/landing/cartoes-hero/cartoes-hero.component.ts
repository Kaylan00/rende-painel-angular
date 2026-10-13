import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlutuarDirective } from '../../../shared/movimento/flutuar.directive';
import { RevelarDirective } from '../../../shared/movimento/revelar.directive';

/**
 * Três pedaços do painel do Rende flutuando sobre a foto do topo:
 * pedido novo, receita líquida do Pix e um pedido saindo para entrega.
 * Os valores são ilustrativos (iguais ao restaurante de demonstração).
 */
@Component({
  selector: 'app-cartoes-hero',
  imports: [RevelarDirective, FlutuarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', 'aria-label': 'Exemplos do painel do Rende' },
  templateUrl: './cartoes-hero.component.html',
  styleUrl: './cartoes-hero.component.scss',
})
export class CartoesHeroComponent {}
