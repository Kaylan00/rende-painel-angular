import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacaoService } from '../../core/notificacao.service';

/** Mostra os avisos do NotificacaoService. Fica uma vez só, no componente raiz. */
@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avisos" aria-live="polite">
      @for (aviso of notificacoes.avisos(); track aviso.id) {
        <div class="aviso" [class]="'aviso aviso--' + aviso.tipo" [attr.role]="aviso.tipo === 'erro' ? 'alert' : 'status'">
          <span>{{ aviso.texto }}</span>
          <button type="button" class="fechar" aria-label="Fechar aviso" (click)="notificacoes.fechar(aviso.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .avisos {
      position: fixed;
      right: var(--espaco-4);
      bottom: var(--espaco-4);
      left: var(--espaco-4);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--espaco-2);
      align-items: flex-end;
      pointer-events: none;
    }
    @media (max-width: 899px) {
      .avisos { bottom: 4.5rem; } /* acima do menu inferior */
    }
    .aviso {
      display: flex;
      gap: var(--espaco-3);
      align-items: center;
      max-width: 26rem;
      padding: var(--espaco-3) var(--espaco-3) var(--espaco-3) var(--espaco-4);
      font-weight: 500;
      color: var(--creme);
      background: var(--verde-950);
      border-radius: var(--raio-pequeno);
      box-shadow: var(--sombra-alta);
      pointer-events: auto;
    }
    .aviso::before {
      flex: none;
      width: 0.5rem;
      height: 0.5rem;
      content: '';
      border-radius: 50%;
      background: var(--verde-200);
    }
    .aviso--erro::before { background: var(--acento-claro); }
    .aviso--info::before { background: var(--creme); }
    .fechar {
      min-width: 2rem;
      min-height: 2rem;
      font-size: 1.25rem;
      color: inherit;
      cursor: pointer;
      background: none;
      border: 0;
    }
  `,
})
export class ToastComponent {
  protected readonly notificacoes = inject(NotificacaoService);
}
