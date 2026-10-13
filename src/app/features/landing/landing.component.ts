import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import {
  calcularLiquido,
  FORMAS_PAGAMENTO,
  FormaPagamento,
  PRAZO_RECEBIMENTO_DIAS,
  ROTULO_FORMA,
  TAXA_BPS,
} from '../../core/models/pedido.model';
import { formatarBps, formatarMoeda } from '../../core/utils/moeda';
import { RevelarDirective } from '../../shared/movimento/revelar.directive';
import { CalculadoraComponent } from './calculadora/calculadora.component';
import { CartoesHeroComponent } from './cartoes-hero/cartoes-hero.component';
import { MENSALIDADE_RENDE_CENTAVOS } from './comparativo';
import { CREDITOS_FOTOS, INCLUSO_NO_PLANO, LINK_WHATSAPP, MODELOS, PASSOS, PERGUNTAS } from './conteudo';

const VALOR_EXEMPLO_CENTAVOS = 10_000; // R$ 100,00

export interface LinhaReceita {
  forma: FormaPagamento;
  rotulo: string;
  taxa: string;
  prazo: string;
  liquido: string;
}

function textoPrazo(forma: FormaPagamento): string {
  if (forma === 'dinheiro') return 'na mão';
  const dias = PRAZO_RECEBIMENTO_DIAS[forma];
  if (dias === 0) return 'cai na hora';
  if (dias === 1) return 'cai no dia seguinte';
  return `cai em ${dias} dias`;
}

/** Monta a tabela "quanto cai de verdade" com as MESMAS regras de taxa do painel. */
export function montarReceita(brutoCentavos = VALOR_EXEMPLO_CENTAVOS): LinhaReceita[] {
  const ordem: FormaPagamento[] = ['pix', 'debito', 'credito', 'dinheiro'];
  return ordem
    .filter((forma) => FORMAS_PAGAMENTO.includes(forma))
    .map((forma) => ({
      forma,
      rotulo: ROTULO_FORMA[forma],
      taxa: TAXA_BPS[forma] === 0 ? 'sem taxa' : 'taxa ' + formatarBps(TAXA_BPS[forma]),
      prazo: textoPrazo(forma),
      liquido: formatarMoeda(calcularLiquido(brutoCentavos, forma).liquidoCentavos),
    }));
}

/** Página pública do Rende ("/"). O painel continua atrás do login. */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, CalculadoraComponent, CartoesHeroComponent, RevelarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'aoRolar()' },
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly auth = inject(AuthService);

  protected readonly autenticado = this.auth.autenticado;
  protected readonly whatsapp = LINK_WHATSAPP;
  protected readonly passos = PASSOS;
  protected readonly modelos = MODELOS;
  protected readonly perguntas = PERGUNTAS;
  protected readonly incluso = INCLUSO_NO_PLANO;
  protected readonly creditos = CREDITOS_FOTOS;
  protected readonly receita = montarReceita();
  /** Preço redondo para o destaque (R$ 129), sem centavos. */
  protected readonly mensalidade = formatarMoeda(MENSALIDADE_RENDE_CENTAVOS).replace(/,00$/, '');

  /** Topo transparente sobre a foto; ganha fundo quando a página rola. */
  protected readonly rolou = signal(false);

  protected aoRolar() {
    this.rolou.set(window.scrollY > 24);
  }
}
