import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BotaoComponent } from './botao.component';

const TITULO_PADRAO = {
  carregando: '',
  vazio: 'Nada por aqui ainda',
  erro: 'Não deu para carregar',
} as const;

/** Mensagem para os estados "carregando", "vazio" e "erro" das telas. */
@Component({
  selector: 'app-estado',
  imports: [BotaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="estado" [class]="'estado estado--' + tipo()" [attr.role]="tipo() === 'erro' ? 'alert' : 'status'">
      @if (tipo() === 'carregando') {
        <span class="trilho" aria-hidden="true"><span></span></span>
        <p>{{ mensagem() }}</p>
      } @else {
        <span class="marca" aria-hidden="true">{{ tipo() === 'erro' ? '!' : '—' }}</span>
        <p class="titulo">{{ tituloFinal() }}</p>
        <p>{{ mensagem() }}</p>
        @if (tipo() === 'erro') {
          <button appBotao variante="secundario" type="button" (click)="tentarNovamente.emit()">Tentar novamente</button>
        }
      }
    </div>
  `,
  styles: `
    .estado {
      display: flex;
      flex-direction: column;
      gap: var(--espaco-2);
      align-items: center;
      padding: var(--espaco-8) var(--espaco-4);
      text-align: center;
    }
    p { margin: 0; max-width: 32rem; color: var(--cor-texto-suave); }
    .titulo {
      font-family: var(--fonte-titulo);
      font-size: 1.5rem;
      color: var(--verde-950);
    }
    .marca {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      margin-bottom: var(--espaco-2);
      font-family: var(--fonte-titulo);
      font-size: 1.375rem;
      color: var(--verde-900);
      background: var(--verde-100);
      border-radius: 50%;
    }
    .estado--erro .marca { color: var(--cor-perigo); background: var(--cor-perigo-fundo); }
    .estado--erro button { margin-top: var(--espaco-3); }
    .trilho {
      position: relative;
      width: 8rem;
      height: 3px;
      margin-bottom: var(--espaco-2);
      overflow: hidden;
      background: var(--linha);
      border-radius: 3px;
    }
    .trilho span {
      position: absolute;
      inset: 0 auto 0 0;
      width: 40%;
      background: var(--verde-900);
      border-radius: 3px;
      animation: correr 1.1s var(--curva) infinite;
    }
    @keyframes correr {
      from { transform: translateX(-100%); }
      to { transform: translateX(250%); }
    }
  `,
})
export class EstadoComponent {
  tipo = input.required<'carregando' | 'vazio' | 'erro'>();
  mensagem = input.required<string>();
  /** Título opcional; se não vier, usa um padrão por tipo. */
  titulo = input('');
  tentarNovamente = output<void>();

  protected readonly tituloFinal = computed(() => this.titulo() || TITULO_PADRAO[this.tipo()]);
}
