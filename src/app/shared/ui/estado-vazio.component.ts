import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BotaoComponent } from './botao.component';

/** Mensagem para os estados "carregando", "vazio" e "erro" das telas. */
@Component({
  selector: 'app-estado',
  imports: [BotaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="estado" [attr.role]="tipo() === 'erro' ? 'alert' : 'status'">
      @if (tipo() === 'carregando') {
        <span class="spinner" aria-hidden="true"></span>
      }
      <p>{{ mensagem() }}</p>
      @if (tipo() === 'erro') {
        <button appBotao variante="secundario" type="button" (click)="tentarNovamente.emit()">Tentar novamente</button>
      }
    </div>
  `,
  styles: `
    .estado {
      display: flex;
      flex-direction: column;
      gap: var(--espaco-3);
      align-items: center;
      padding: var(--espaco-6) var(--espaco-4);
      text-align: center;
      background: var(--cor-superficie);
      border: 1px dashed var(--cor-borda);
      border-radius: var(--raio);
    }
    p { margin: 0; color: var(--cor-texto-suave); }
    .spinner {
      width: 1.75rem;
      height: 1.75rem;
      border: 3px solid var(--cor-borda);
      border-top-color: var(--cor-primaria);
      border-radius: 50%;
      animation: girar 0.8s linear infinite;
    }
    @keyframes girar { to { transform: rotate(360deg); } }
  `,
})
export class EstadoComponent {
  tipo = input.required<'carregando' | 'vazio' | 'erro'>();
  mensagem = input.required<string>();
  tentarNovamente = output<void>();
}
