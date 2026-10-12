import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

export interface Coluna<T> {
  chave: keyof T & string;
  titulo: string;
  alinhar?: 'esquerda' | 'direita';
}

export interface ContextoCelula<T> {
  $implicit: T;
  coluna: Coluna<T>;
}

/**
 * Tabela genérica. Mostra as colunas informadas e, se a tela passar um
 * <ng-template> em `celula`, deixa a tela desenhar as células do jeito dela.
 * No celular a tabela rola na horizontal dentro do próprio container.
 */
@Component({
  selector: 'app-tabela',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabela.component.html',
  styleUrl: './tabela.component.scss',
})
export class TabelaComponent<T extends object> {
  legenda = input.required<string>();
  colunas = input.required<Coluna<T>[]>();
  linhas = input.required<T[]>();
  celula = input<TemplateRef<ContextoCelula<T>> | null>(null);
}
