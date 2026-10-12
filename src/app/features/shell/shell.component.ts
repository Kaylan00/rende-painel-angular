import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../../shared/ui/botao.component';

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
    { rota: '/dashboard', rotulo: 'Dashboard', icone: '▦' },
    { rota: '/pedidos', rotulo: 'Pedidos', icone: '☰' },
    { rota: '/recebiveis', rotulo: 'Recebíveis', icone: '$' },
    { rota: '/cobrancas/nova', rotulo: 'Cobrança', icone: '+' },
  ];

  protected sair() {
    this.auth.logout();
  }
}
