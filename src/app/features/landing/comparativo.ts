import { aplicarBps } from '../../core/utils/moeda';

/** Comissão típica de app de delivery no plano com entrega (27% por pedido), em basis points. */
export const COMISSAO_APP_BPS = 2700;

/** Mensalidade fixa do Rende (valor de demonstração), em centavos. */
export const MENSALIDADE_RENDE_CENTAVOS = 12_900;

export interface Comparativo {
  faturamentoCentavos: number;
  /** O que o app de delivery leva no mês. */
  comissaoAppCentavos: number;
  /** O que sobra para a loja vendendo pelo app. */
  sobraAppCentavos: number;
  /** O que o Rende custa no mês (sempre a mensalidade). */
  custoRendeCentavos: number;
  /** O que sobra para a loja vendendo pelo Rende. */
  sobraRendeCentavos: number;
  /** Quanto a loja fica a mais por mês com o Rende (pode ser negativo em faturamentos muito baixos). */
  diferencaMesCentavos: number;
  diferencaAnoCentavos: number;
}

/**
 * Compara comissão por pedido x mensalidade fixa. Função pura, tudo em centavos inteiros.
 * As taxas do Pix/cartão existem nos dois cenários, por isso ficam de fora da comparação.
 */
export function compararCustos(
  faturamentoCentavos: number,
  comissaoBps = COMISSAO_APP_BPS,
  mensalidadeCentavos = MENSALIDADE_RENDE_CENTAVOS,
): Comparativo {
  const faturamento = Math.max(0, Math.round(faturamentoCentavos));
  const comissaoAppCentavos = aplicarBps(faturamento, comissaoBps);
  const sobraAppCentavos = faturamento - comissaoAppCentavos;
  const sobraRendeCentavos = faturamento - mensalidadeCentavos;
  const diferencaMesCentavos = sobraRendeCentavos - sobraAppCentavos;

  return {
    faturamentoCentavos: faturamento,
    comissaoAppCentavos,
    sobraAppCentavos,
    custoRendeCentavos: mensalidadeCentavos,
    sobraRendeCentavos,
    diferencaMesCentavos,
    diferencaAnoCentavos: diferencaMesCentavos * 12,
  };
}
