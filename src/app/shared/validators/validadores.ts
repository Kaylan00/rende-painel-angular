import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { formatarMoeda } from '../../core/utils/moeda';

/**
 * Um ValidatorFn recebe o controle e devolve `null` (válido) ou um objeto de erro.
 * Estas funções são "fábricas": recebem a configuração e devolvem o validador.
 */

/** Valor em centavos não pode ser menor que `minimo`. */
export function valorMinimo(minimoCentavos: number): ValidatorFn {
  return (controle: AbstractControl): ValidationErrors | null => {
    const valor = controle.value as number | null;
    if (valor === null || valor === undefined) return null; // "required" cuida do vazio
    return valor < minimoCentavos ? { valorMinimo: { minimo: formatarMoeda(minimoCentavos) } } : null;
  };
}

export function valorMaximo(maximoCentavos: number): ValidatorFn {
  return (controle: AbstractControl): ValidationErrors | null => {
    const valor = controle.value as number | null;
    if (valor === null || valor === undefined) return null;
    return valor > maximoCentavos ? { valorMaximo: { maximo: formatarMoeda(maximoCentavos) } } : null;
  };
}

function todosIguais(digitos: string): boolean {
  return /^(\d)\1+$/.test(digitos);
}

function calcularDigito(digitos: string, pesos: number[]): number {
  const soma = pesos.reduce((acc, peso, i) => acc + Number(digitos[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11 || todosIguais(d)) return false;
  const d1 = calcularDigito(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcularDigito(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function cnpjValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 14 || todosIguais(d)) return false;
  const d1 = calcularDigito(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcularDigito(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

/** Aceita CPF ou CNPJ (com ou sem pontuação). Campo vazio é válido: use `required` se for obrigatório. */
export const cpfOuCnpj: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const texto = ((controle.value as string | null) ?? '').trim();
  if (texto === '') return null;
  return cpfValido(texto) || cnpjValido(texto) ? null : { documentoInvalido: true };
};
