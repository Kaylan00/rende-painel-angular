import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { calcularLiquido } from '../../../../core/models/pedido.model';
import { formatarMoeda } from '../../../../core/utils/moeda';
import { ContadorDirective } from '../../../../shared/movimento/contador.directive';
import { QrPlaceholderComponent } from '../../../../shared/ui/qr-placeholder.component';
import { JORNADA, PEDIDO_EXEMPLO, STATUS_CARTAO, statusDoPasso } from '../camadas';

/** Rótulos curtos da linha do tempo (sempre visível durante a montagem). */
export const ROTULOS_LINHA = ['QR Code', 'Painel', 'Cozinha', 'Entrega', 'Pix'];

/** Itens da comanda que a impressora da cozinha solta no passo 3. */
export const COMANDA = [
  { qtd: 1, item: 'Bocca Duplo', obs: 'sem cebola' },
  { qtd: 1, item: 'Batata média', obs: 'páprica' },
  { qtd: 1, item: 'Refrigerante lata', obs: '' },
];

/** Quanto da linha do tempo está preenchido (0 a 1) em cada passo. */
export function progressoLinha(passo: number, total = ROTULOS_LINHA.length): number {
  if (passo <= 1) return 0;
  return Math.min(1, (passo - 1) / (total - 1));
}

/**
 * A jornada do pedido contada com objetos: celular lendo o QR, pedido chegando no painel,
 * comanda saindo da impressora, rota do motoboy e o Pix caindo na conta.
 * Recebe o passo atual do palco (que vem da rolagem). Sem movimento, mostra tudo parado.
 */
@Component({
  selector: 'app-jornada',
  imports: [QrPlaceholderComponent, ContadorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jornada.component.html',
  styleUrl: './jornada.component.scss',
  host: { '[class.jornada--viva]': 'vivo()' },
})
export class JornadaComponent {
  readonly passo = input.required<number>();
  readonly vivo = input(false);

  protected readonly jornada = JORNADA;
  protected readonly rotulos = ROTULOS_LINHA;
  protected readonly comanda = COMANDA;
  protected readonly pedido = PEDIDO_EXEMPLO;
  protected readonly statusCartao = STATUS_CARTAO;
  protected readonly totalPedido = formatarMoeda(PEDIDO_EXEMPLO.totalCentavos);
  protected readonly liquidoPix = formatarMoeda(calcularLiquido(PEDIDO_EXEMPLO.totalCentavos, 'pix').liquidoCentavos);
  protected readonly statusAceso = computed(() => statusDoPasso(this.passo()));
  protected readonly progresso = computed(() => progressoLinha(this.passo()));
  /** Sem movimento todos os objetos ficam à mostra; com movimento, só o passo atual e o anterior. */
  protected estado(i: number): 'atual' | 'antes' | 'fora' {
    if (!this.vivo()) return 'atual';
    const p = this.passo();
    if (p === i + 1) return 'atual';
    if (p === i + 2) return 'antes';
    return 'fora';
  }
}
