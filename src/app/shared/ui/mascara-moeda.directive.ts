import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatarMoeda, textoParaCentavos } from '../../core/utils/moeda';

/**
 * Máscara de reais para campos de formulário reativo.
 * O usuário vê "R$ 1.234,56" e o FormControl guarda 123456 (centavos, number).
 * Para funcionar com formControlName ela implementa ControlValueAccessor:
 * a "ponte" entre o <input> e o FormControl.
 */
@Directive({
  selector: 'input[appMascaraMoeda]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MascaraMoedaDirective), multi: true },
  ],
})
export class MascaraMoedaDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  private aoMudar: (centavos: number | null) => void = () => undefined;
  private aoTocar: () => void = () => undefined;

  // FormControl -> tela
  writeValue(centavos: number | null): void {
    this.el.value = centavos === null || centavos === undefined ? '' : formatarMoeda(centavos);
  }

  registerOnChange(fn: (centavos: number | null) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.el.disabled = desabilitado;
  }

  // tela -> FormControl
  @HostListener('input')
  protected aoDigitar() {
    const centavos = textoParaCentavos(this.el.value);
    // limite de segurança: 9 dígitos = R$ 9.999.999,99
    const limitado = centavos !== null && centavos > 999_999_999 ? Math.floor(centavos / 10) : centavos;
    this.el.value = limitado === null ? '' : formatarMoeda(limitado);
    this.aoMudar(limitado);
  }

  @HostListener('blur')
  protected aoSair() {
    this.aoTocar();
  }
}
