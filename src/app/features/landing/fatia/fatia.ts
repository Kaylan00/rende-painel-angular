import { compararCustos, Comparativo, COMISSAO_APP_BPS, MENSALIDADE_RENDE_CENTAVOS } from '../comparativo';

export const FATURAMENTO_MIN_REAIS = 2_000;
export const FATURAMENTO_MAX_REAIS = 120_000;
export const FATURAMENTO_PADRAO_REAIS = 30_000;
export const COMISSAO_MIN_PCT = 10;
export const COMISSAO_MAX_PCT = 30;
export const COMISSAO_PADRAO_PCT = COMISSAO_APP_BPS / 100;

/** Menor e maior tamanho da pizza na tela (1 = tamanho cheio). */
const ESCALA_MIN = 0.78;
const ESCALA_MAX = 1;

export interface Fatia extends Comparativo {
  /** Abertura da fatia do app, em graus (27% = 97,2°). */
  graus: number;
  /** Tamanho da pizza conforme o faturamento (de 0,78 a 1). */
  escala: number;
  /** true quando a mensalidade sai mais barata que a comissão. */
  rendeCompensa: boolean;
}

const limitar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));

/**
 * A pizza é o faturamento do mês; a fatia é o que o app leva de comissão.
 * Função pura: recebe o que os sliders mostram (reais e % inteiro) e devolve
 * o ângulo da fatia, o tamanho da pizza e os valores em centavos (via compararCustos).
 */
export function calcularFatia(
  faturamentoReais: number,
  comissaoPct: number,
  mensalidadeCentavos = MENSALIDADE_RENDE_CENTAVOS,
): Fatia {
  const faturamento = limitar(Math.round(faturamentoReais), 0, FATURAMENTO_MAX_REAIS);
  const comissao = limitar(comissaoPct, 0, 100);
  const comparativo = compararCustos(faturamento * 100, Math.round(comissao * 100), mensalidadeCentavos);

  const faixa = FATURAMENTO_MAX_REAIS - FATURAMENTO_MIN_REAIS;
  const proporcao = limitar((faturamento - FATURAMENTO_MIN_REAIS) / faixa, 0, 1);

  return {
    ...comparativo,
    graus: Math.round(comissao * 3.6 * 10) / 10,
    escala: Math.round((ESCALA_MIN + (ESCALA_MAX - ESCALA_MIN) * proporcao) * 1000) / 1000,
    rendeCompensa: comparativo.diferencaMesCentavos > 0,
  };
}

/** Direção para onde a fatia é puxada (0° = para cima, sentido horário). Tem que bater com --meio no CSS. */
export const DIRECAO_FATIA_GRAUS = 48;

export interface Ponto {
  x: number;
  y: number;
}

/**
 * Ponto na pizza vista de cima, em % do quadrado (centro = 50, 50).
 * Ângulo em graus a partir do topo, no sentido horário (o mesmo do conic-gradient).
 */
export function pontoNaPizza(anguloGraus: number, raioPct: number): Ponto {
  const rad = (anguloGraus * Math.PI) / 180;
  const arred = (v: number) => Math.round(v * 100) / 100;
  return { x: arred(50 + raioPct * Math.sin(rad)), y: arred(50 - raioPct * Math.cos(rad)) };
}

/** As duas linhas do corte (do centro até a borda) para uma fatia de `graus` apontada para `direcao`. */
export function cortesDaFatia(graus: number, direcao = DIRECAO_FATIA_GRAUS, raioPct = 49): [Ponto, Ponto] {
  return [pontoNaPizza(direcao - graus / 2, raioPct), pontoNaPizza(direcao + graus / 2, raioPct)];
}
