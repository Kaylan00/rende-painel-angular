import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BotaoComponent } from './botao.component';

@Component({
  selector: 'app-paginacao',
  imports: [BotaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="paginacao" aria-label="Paginação">
      <button appBotao variante="secundario" tamanho="pequeno" type="button"
        [disabled]="pagina() <= 1" (click)="mudar.emit(pagina() - 1)">
        Anterior
      </button>
      <span class="numero" aria-live="polite">Página {{ pagina() }} de {{ totalPaginas() }} ({{ total() }} pedidos)</span>
      <button appBotao variante="secundario" tamanho="pequeno" type="button"
        [disabled]="pagina() >= totalPaginas()" (click)="mudar.emit(pagina() + 1)">
        Próxima
      </button>
    </nav>
  `,
  styles: `
    .paginacao {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--espaco-3);
      font-size: 0.875rem;
    }
  `,
})
export class PaginacaoComponent {
  pagina = input.required<number>();
  porPagina = input.required<number>();
  total = input.required<number>();
  /** Emite o número da página que o usuário quer ver. */
  mudar = output<number>();

  protected totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.porPagina())));
}
