import { ChangeDetectionStrategy, Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Modal usando o <dialog> nativo: o navegador cuida do foco preso dentro dele,
 * da tecla Esc e do fundo escurecido. Conteúdo entra por projeção (<ng-content>).
 *
 *   <app-modal [aberto]="mostrar()" titulo="Confirmar" (fechar)="mostrar.set(false)">...</app-modal>
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialogo class="modal" [attr.aria-labelledby]="idTitulo" (cancel)="aoCancelar($event)">
      <div class="modal__conteudo">
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(30rem, calc(100vw - 2rem));
      padding: 0;
      color: var(--cor-texto);
      background: var(--papel);
      border: 0;
      border-radius: var(--raio);
      box-shadow: 0 12px 40px rgb(0 0 0 / 25%);
    }
    .modal::backdrop {
      background: rgb(11 46 35 / 55%);
    }
    .modal__conteudo {
      display: flex;
      flex-direction: column;
      gap: var(--espaco-4);
      padding: var(--espaco-5);
    }
  `,
})
export class ModalComponent {
  aberto = input.required<boolean>();
  titulo = input.required<string>();
  fechar = output<void>();

  protected readonly idTitulo = `modal-titulo-${Math.random().toString(36).slice(2, 8)}`;
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    // effect: roda sempre que o signal `aberto` muda
    effect(() => {
      const el = this.dialogo().nativeElement;
      if (this.aberto() && !el.open) {
        if (typeof el.showModal === 'function') {
          el.showModal();
        } else {
          el.setAttribute('open', ''); // jsdom (testes) não implementa showModal
        }
      } else if (!this.aberto() && el.open) {
        if (typeof el.close === 'function') {
          el.close();
        } else {
          el.removeAttribute('open');
        }
      }
    });
  }

  /** Esc: deixamos o pai decidir, em vez de o navegador fechar sozinho. */
  protected aoCancelar(evento: Event) {
    evento.preventDefault();
    this.fechar.emit();
  }
}
