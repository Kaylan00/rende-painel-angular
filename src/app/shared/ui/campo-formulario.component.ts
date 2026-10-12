import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

const MENSAGENS: Record<string, (erro: Record<string, string>) => string> = {
  required: () => 'Campo obrigatório.',
  email: () => 'Informe um e-mail válido.',
  minlength: () => 'Texto curto demais.',
  maxlength: () => 'Texto longo demais.',
  valorMinimo: (e) => `O valor mínimo é ${e['minimo']}.`,
  valorMaximo: (e) => `O valor máximo é ${e['maximo']}.`,
  documentoInvalido: () => 'CPF ou CNPJ inválido.',
};

/**
 * Rótulo + campo + mensagem de erro. O <input> é projetado (ng-content) e
 * precisa ter o mesmo `id` informado aqui, para o label ficar associado.
 * O erro só aparece depois que o usuário toca no campo (touched).
 */
@Component({
  selector: 'app-campo',
  template: `
    <div class="campo">
      <label [for]="id()">{{ rotulo() }}@if (obrigatorio()) {<span aria-hidden="true"> *</span>}</label>
      <ng-content />
      @if (dica() && !mensagemErro()) {
        <small class="campo__dica">{{ dica() }}</small>
      }
      @if (mensagemErro(); as mensagem) {
        <small class="campo__erro" role="alert">{{ mensagem }}</small>
      }
    </div>
  `,
  styles: `
    .campo { display: flex; flex-direction: column; gap: var(--espaco-1); }
    label { font-size: 0.875rem; font-weight: 600; }
    .campo__dica { color: var(--cor-texto-suave); }
    .campo__erro { color: var(--cor-perigo); font-weight: 600; }
  `,
})
export class CampoFormularioComponent {
  id = input.required<string>();
  rotulo = input.required<string>();
  dica = input<string>('');
  obrigatorio = input(false);
  /**
   * Sem OnPush de propósito: touched/errors do FormControl não são signals,
   * então o campo precisa ser reavaliado a cada ciclo de detecção.
   */
  controle = input<AbstractControl | null>(null);

  // Os erros do controle não são signals, então calculamos pela função no template.
  protected mensagemErro = (): string => {
    const c = this.controle();
    if (!c || !c.touched || !c.errors) return '';
    const [chave, valor] = Object.entries(c.errors)[0];
    const montar = MENSAGENS[chave];
    return montar ? montar((valor ?? {}) as Record<string, string>) : 'Valor inválido.';
  };
}
