import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BotaoComponent } from '../../shared/ui/botao.component';
import { CampoFormularioComponent } from '../../shared/ui/campo-formulario.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, BotaoComponent, CampoFormularioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Vem de ?retorno=/pedidos (withComponentInputBinding liga query param -> input). */
  retorno = input<string>('/dashboard');

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // faz as mensagens de erro aparecerem
      return;
    }
    this.erro.set('');
    this.enviando.set(true);
    const { email, senha } = this.form.getRawValue();

    this.auth
      .login(email, senha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigateByUrl(this.retorno() || "/dashboard"),
        error: () => {
          this.enviando.set(false);
          this.erro.set('E-mail ou senha inválidos. Use qualquer e-mail válido e senha com 6+ caracteres.');
        },
      });
  }
}
