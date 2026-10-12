import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { PainelService } from '../../core/api/painel.service';
import { Cobranca, NovaCobranca, TipoCobranca } from '../../core/models/painel.model';
import { NotificacaoService } from '../../core/notificacao.service';
import { mensagemDeErro } from '../../core/utils/estado-requisicao';
import { MoedaPipe } from '../../shared/pipes/moeda.pipe';
import { cpfOuCnpj, valorMaximo, valorMinimo } from '../../shared/validators/validadores';
import { BotaoComponent } from '../../shared/ui/botao.component';
import { CampoFormularioComponent } from '../../shared/ui/campo-formulario.component';
import { MascaraMoedaDirective } from '../../shared/ui/mascara-moeda.directive';
import { ModalComponent } from '../../shared/ui/modal.component';
import { QrPlaceholderComponent } from '../../shared/ui/qr-placeholder.component';

export const VALOR_MINIMO_CENTAVOS = 100; // R$ 1,00
export const VALOR_MAXIMO_CENTAVOS = 500_000; // R$ 5.000,00

@Component({
  selector: 'app-nova-cobranca',
  imports: [
    ReactiveFormsModule, MoedaPipe, BotaoComponent, CampoFormularioComponent,
    MascaraMoedaDirective, ModalComponent, QrPlaceholderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nova-cobranca.component.html',
  styleUrl: './nova-cobranca.component.scss',
})
export class NovaCobrancaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly painel = inject(PainelService);
  private readonly avisos = inject(NotificacaoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['pix' as TipoCobranca],
    descricao: ['', [Validators.required, Validators.maxLength(80)]],
    // o FormControl guarda centavos (number), a máscara cuida de mostrar "R$ 0,00"
    valorCentavos: this.fb.control<number | null>(null, [
      Validators.required,
      valorMinimo(VALOR_MINIMO_CENTAVOS),
      valorMaximo(VALOR_MAXIMO_CENTAVOS),
    ]),
    clienteNome: ['', [Validators.required, Validators.minLength(3)]],
    clienteDocumento: ['', [cpfOuCnpj]],
    validadeHoras: [24],
  });

  /** Valores do formulário como signal: o preview recalcula sozinho a cada digitação. */
  protected readonly valores = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  protected readonly previewTexto = computed(() => {
    const v = this.valores();
    return `rende|${v.tipo}|${v.descricao}|${v.valorCentavos ?? 0}`;
  });
  protected readonly previewLink = computed(() => {
    const v = this.valores();
    const sufixo = (v.descricao ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    return `pay.rende.app/c/${sufixo || 'sua-cobranca'}`;
  });

  protected readonly confirmando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly criada = signal<Cobranca | null>(null);

  protected pedirConfirmacao() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmando.set(true);
  }

  protected confirmar() {
    const v = this.form.getRawValue();
    const dados: NovaCobranca = {
      tipo: v.tipo,
      descricao: v.descricao.trim(),
      valorCentavos: v.valorCentavos ?? 0,
      clienteNome: v.clienteNome.trim(),
      clienteDocumento: v.clienteDocumento.trim(),
      validadeHoras: Number(v.validadeHoras),
    };
    this.enviando.set(true);

    this.painel
      .criarCobranca(dados)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cobranca) => {
          this.enviando.set(false);
          this.confirmando.set(false);
          this.criada.set(cobranca);
          this.avisos.sucesso('Cobrança criada com sucesso!');
          this.form.reset({ tipo: dados.tipo, validadeHoras: 24 });
        },
        error: (erro: unknown) => {
          this.enviando.set(false);
          this.confirmando.set(false);
          this.avisos.erro(mensagemDeErro(erro));
        },
      });
  }

  protected copiar(texto: string) {
    navigator.clipboard?.writeText(texto).then(
      () => this.avisos.info('Link copiado.'),
      () => this.avisos.erro('Não foi possível copiar. Copie manualmente.'),
    );
  }
}
