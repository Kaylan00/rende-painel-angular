import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { BadgeStatusComponent } from './badge-status.component';
import { CampoFormularioComponent } from './campo-formulario.component';
import { GraficoBarrasComponent } from './grafico-barras.component';
import { ModalComponent } from './modal.component';
import { PaginacaoComponent } from './paginacao.component';
import { MetricCardComponent } from './metric-card.component';

@Component({
  imports: [ModalComponent],
  template: `
    <app-modal [aberto]="aberto()" titulo="Teste" (fechar)="aberto.set(false); fechou = true">
      <p>conteúdo</p>
    </app-modal>
  `,
})
class HospedeModal {
  aberto = signal(false);
  fechou = false;
}

describe('componentes do design system', () => {
  it('modal abre e fecha conforme o signal e emite "fechar" no Esc', async () => {
    const fixture = TestBed.createComponent(HospedeModal);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(false);

    fixture.componentInstance.aberto.set(true);
    fixture.detectChanges();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('conteúdo');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();

    dialog.dispatchEvent(new Event('cancel', { cancelable: true })); // tecla Esc
    expect(fixture.componentInstance.fechou).toBe(true);
    fixture.detectChanges();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('campo: mostra a mensagem de erro só depois de tocado', () => {
    const controle = new FormControl('', { validators: (c) => (c.value ? null : { required: true }) });
    const fixture = TestBed.createComponent(CampoFormularioComponent);
    fixture.componentRef.setInput('para', 'nome');
    fixture.componentRef.setInput('rotulo', 'Nome');
    fixture.componentRef.setInput('controle', controle);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(el.querySelector('label')?.getAttribute('for')).toBe('nome');

    controle.markAsTouched();
    fixture.detectChanges();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Campo obrigatório.');
  });

  it('paginação: desabilita os limites e emite a página pedida', () => {
    const fixture = TestBed.createComponent(PaginacaoComponent);
    fixture.componentRef.setInput('pagina', 1);
    fixture.componentRef.setInput('porPagina', 8);
    fixture.componentRef.setInput('total', 20);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const [anterior, proxima] = Array.from(el.querySelectorAll('button'));
    const paginas: number[] = [];
    fixture.componentInstance.mudar.subscribe((p) => paginas.push(p));

    expect(el.textContent).toContain('Página 1 de 3');
    expect(anterior.disabled).toBe(true);
    proxima.click();
    expect(paginas).toEqual([2]);
  });

  it('badge mostra o nome do status em português', () => {
    const fixture = TestBed.createComponent(BadgeStatusComponent);
    fixture.componentRef.setInput('status', 'aguardando_pagamento');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aguardando pagamento');
  });

  it('card de métrica mostra título, valor e legenda', () => {
    const fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('titulo', 'Vendas do dia');
    fixture.componentRef.setInput('valor', 'R$ 10,00');
    fixture.componentRef.setInput('legenda', '3 pedidos');
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Vendas do dia');
    expect(texto).toContain('R$ 10,00');
    expect(texto).toContain('3 pedidos');
  });

  it('gráfico: a barra mais alta ocupa a área útil e o zero não tem altura', () => {
    const fixture = TestBed.createComponent(GraficoBarrasComponent);
    fixture.componentRef.setInput('pontos', [
      { data: '2026-10-11', valorCentavos: 0 },
      { data: '2026-10-12', valorCentavos: 10_000 },
    ]);
    fixture.detectChanges();
    const barras = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('rect.barra'));
    expect(barras).toHaveLength(2);
    expect(Number(barras[0].getAttribute('height'))).toBe(0);
    expect(Number(barras[1].getAttribute('height'))).toBeGreaterThan(100);
    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toContain('12/10');
  });
});
