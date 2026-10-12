/** Funções de data trabalhando sempre com "yyyy-MM-dd" no fuso local. */

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

export function paraDataLocal(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Converte um ISO (UTC) na data local yyyy-MM-dd. */
export function isoParaDataLocal(iso: string): string {
  return paraDataLocal(new Date(iso));
}

export function somarDias(dataLocal: string, dias: number): string {
  const [ano, mes, dia] = dataLocal.split('-').map(Number);
  // meio-dia evita problemas de horário de verão
  return paraDataLocal(new Date(ano, mes - 1, dia + dias, 12));
}

/** "2026-10-12" -> "12/10/2026" */
export function formatarDataBr(dataLocal: string): string {
  const [ano, mes, dia] = dataLocal.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "2026-10-12" -> "12/10" */
export function formatarDiaMes(dataLocal: string): string {
  return formatarDataBr(dataLocal).slice(0, 5);
}
