import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../../shared/ui/botao.component';

/** Ícones de traço simples (24x24), desenhados à mão para o menu. */
const ICONES = {
  resumo: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  pedidos: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  recebiveis: 'M4 6h16v12H4zM4 10h16M8 15h3',
  cobranca: 'M12 5v14M5 12h14',
};

/** Layout do painel: menu lateral no desktop, barra inferior no celular. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BotaoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);

  protected readonly menu = [
    { rota: '/dashboard', rotulo: 'Resumo', icone: ICONES.resumo },
    { rota: '/pedidos', rotulo: 'Pedidos', icone: ICONES.pedidos },
    { rota: '/recebiveis', rotulo: 'Recebíveis', icone: ICONES.recebiveis },
    { rota: '/cobrancas/nova', rotulo: 'Cobrança', icone: ICONES.cobranca },
  ];

  protected sair() {
    this.auth.logout();
  }
}
