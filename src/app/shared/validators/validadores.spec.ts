import { FormControl } from '@angular/forms';
import { cnpjValido, cpfOuCnpj, cpfValido, valorMaximo, valorMinimo } from './validadores';

describe('validadores', () => {
  describe('valorMinimo / valorMaximo (centavos)', () => {
    it('rejeita valor abaixo do mínimo', () => {
      const erro = valorMinimo(100)(new FormControl(50));
      expect(erro?.['valorMinimo']).toBeTruthy();
    });

    it('aceita o próprio mínimo e vazio (required cuida do vazio)', () => {
      expect(valorMinimo(100)(new FormControl(100))).toBeNull();
      expect(valorMinimo(100)(new FormControl(null))).toBeNull();
    });

    it('rejeita valor acima do máximo', () => {
      expect(valorMaximo(500_000)(new FormControl(500_001))?.['valorMaximo']).toBeTruthy();
      expect(valorMaximo(500_000)(new FormControl(500_000))).toBeNull();
    });
  });

  describe('CPF e CNPJ', () => {
    it('valida CPF correto, com e sem pontuação', () => {
      expect(cpfValido('529.982.247-25')).toBe(true);
      expect(cpfValido('52998224725')).toBe(true);
    });

    it('rejeita CPF com dígito errado, tamanho errado ou todos iguais', () => {
      expect(cpfValido('52998224726')).toBe(false);
      expect(cpfValido('123')).toBe(false);
      expect(cpfValido('11111111111')).toBe(false);
    });

    it('valida CNPJ', () => {
      expect(cnpjValido('11.222.333/0001-81')).toBe(true);
      expect(cnpjValido('11.222.333/0001-82')).toBe(false);
    });

    it('o validador aceita vazio, CPF ou CNPJ e rejeita o resto', () => {
      expect(cpfOuCnpj(new FormControl(''))).toBeNull();
      expect(cpfOuCnpj(new FormControl('52998224725'))).toBeNull();
      expect(cpfOuCnpj(new FormControl('11222333000181'))).toBeNull();
      expect(cpfOuCnpj(new FormControl('123'))).toEqual({ documentoInvalido: true });
    });
  });
});
