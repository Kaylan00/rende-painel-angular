import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TAMANHO = 21;

function ehMarcadorDeCanto(x: number, y: number): boolean {
  const canto = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
  return canto(0, 0) || canto(TAMANHO - 7, 0) || canto(0, TAMANHO - 7);
}

function celulaMarcador(x: number, y: number): boolean {
  // desenha o quadrado vazado de 7x7 com miolo 3x3, típico de QR
  const dx = x >= TAMANHO - 7 ? x - (TAMANHO - 7) : x;
  const dy = y >= TAMANHO - 7 ? y - (TAMANHO - 7) : y;
  const borda = dx === 0 || dx === 6 || dy === 0 || dy === 6;
  const miolo = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
  return borda || miolo;
}

/**
 * ATENÇÃO: isto NÃO é um QR Code real, só um desenho (placeholder) gerado a
 * partir do texto, para o preview da cobrança. Um QR Pix de verdade seria
 * gerado pelo back-end (payload EMV "copia e cola").
 */
@Component({
  selector: 'app-qr-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 21 21" role="img" aria-label="Pré-visualização ilustrativa do QR Code" shape-rendering="crispEdges">
      <rect width="21" height="21" fill="#fff" />
      @for (c of celulas(); track c.id) {
        <rect [attr.x]="c.x" [attr.y]="c.y" width="1" height="1" fill="#1b2622" />
      }
    </svg>
  `,
  styles: `
    svg { display: block; width: 100%; height: auto; border: 1px solid var(--cor-borda); border-radius: var(--raio-pequeno); }
  `,
})
export class QrPlaceholderComponent {
  texto = input.required<string>();

  protected celulas = computed(() => {
    // hash simples e determinístico do texto -> sequência de bits
    let estado = 2166136261;
    for (const letra of this.texto()) {
      estado = Math.imul(estado ^ letra.charCodeAt(0), 16777619) >>> 0;
    }
    const resultado: { id: number; x: number; y: number }[] = [];
    for (let y = 0; y < TAMANHO; y++) {
      for (let x = 0; x < TAMANHO; x++) {
        estado = (Math.imul(estado, 1103515245) + 12345) >>> 0;
        const ligada = ehMarcadorDeCanto(x, y) ? celulaMarcador(x, y) : (estado >>> 16) % 2 === 0;
        if (ligada) resultado.push({ id: y * TAMANHO + x, x, y });
      }
    }
    return resultado;
  });
}
