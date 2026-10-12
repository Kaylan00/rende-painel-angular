import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { EMPTY, map, switchMap } from 'rxjs';

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
 * precisa ter o mesmo id informado em `para`, assim o label fica associado.
 * O erro só aparece depois que o usuário toca no campo (touched).
 */
@Component({
  selector: 'app-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="campo">
      <label [for]="para()">{{ rotulo() }}@if (obrigatorio()) {<span aria-hidden="true"> *</span>}</label>
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
  /** id do <input> projetado (não usamos "id" para não duplicar o id no elemento host). */
  para = input.required<string>();
  rotulo = input.required<string>();
  dica = input<string>('');
  obrigatorio = input(false);
  controle = input<AbstractControl | null>(null);

  /**
   * `touched` e `errors` do FormControl não são signals. Para o componente poder ser OnPush,
   * transformamos o stream `controle.events` (valor, status, touched...) em um signal "relógio":
   * a cada evento ele recebe um objeto novo e o computed abaixo recalcula.
   */
  private readonly mudancas = toSignal(
    toObservable(this.controle).pipe(switchMap((c) => (c ? c.events.pipe(map(() => ({}))) : EMPTY))),
    { initialValue: {} },
  );

  protected readonly mensagemErro = computed(() => {
    this.mudancas(); // cria a dependência
    const c = this.controle();
    if (!c || !c.touched || !c.errors) return '';
    const [chave, valor] = Object.entries(c.errors)[0];
    const montar = MENSAGENS[chave];
    return montar ? montar((valor ?? {}) as Record<string, string>) : 'Valor inválido.';
  });
}
