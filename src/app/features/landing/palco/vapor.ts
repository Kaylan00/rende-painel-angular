/**
 * Vapor sutil subindo do hambúrguer, desenhado num <canvas> leve.
 * ~28 fiapos, sem biblioteca. Para sozinho quando a seção sai da tela
 * (IntersectionObserver) e quando a aba fica escondida (requestAnimationFrame pausa).
 */
interface Fiapo {
  x: number;
  y: number;
  raio: number;
  vida: number;
  duracao: number;
  deriva: number;
  fase: number;
}

const QUANTIDADE = 28;

export class Vapor {
  private readonly ctx: CanvasRenderingContext2D | null;
  private fiapos: Fiapo[] = [];
  private quadro = 0;
  private visivel = true;
  private largura = 0;
  private altura = 0;
  private readonly observador: IntersectionObserver | null;
  private readonly aoRedimensionar = () => this.medir();
  /** Origem do vapor em fração da tela (0..1); o palco atualiza conforme o hambúrguer se move. */
  origem = { x: 0.5, y: 0.6, espalho: 0.18 };
  /** 0 = sem vapor, 1 = cheio. */
  intensidade = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.medir();
    window.addEventListener('resize', this.aoRedimensionar);
    this.observador =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entrada]) => {
            this.visivel = entrada.isIntersecting;
            if (this.visivel && !this.quadro) this.laco();
          })
        : null;
    this.observador?.observe(canvas);
    for (let i = 0; i < QUANTIDADE; i++) this.fiapos.push(this.novo(Math.random()));
    this.laco();
  }

  private medir() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.largura = this.canvas.clientWidth;
    this.altura = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.largura * dpr);
    this.canvas.height = Math.round(this.altura * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private novo(vidaInicial = 0): Fiapo {
    const { x, y, espalho } = this.origem;
    return {
      x: (x + (Math.random() - 0.5) * espalho) * this.largura,
      y: y * this.altura,
      raio: 18 + Math.random() * 46,
      vida: vidaInicial,
      duracao: 5 + Math.random() * 5,
      deriva: (Math.random() - 0.5) * 18,
      fase: Math.random() * Math.PI * 2,
    };
  }

  private laco = () => {
    this.quadro = 0;
    if (!this.visivel || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.largura, this.altura);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.fiapos.length; i++) {
      const f = this.fiapos[i];
      f.vida += 1 / 60 / f.duracao;
      if (f.vida >= 1) {
        this.fiapos[i] = this.novo();
        continue;
      }
      const subida = f.vida * this.altura * 0.42;
      const px = f.x + Math.sin(f.fase + f.vida * 5) * 14 + f.deriva * f.vida * 4;
      const py = f.y - subida;
      const r = f.raio * (0.6 + f.vida * 1.6);
      // entra e sai devagar (seno), nunca passa de 6% de opacidade
      const alfa = Math.sin(f.vida * Math.PI) * 0.06 * this.intensidade;
      if (alfa <= 0.002) continue;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(245, 236, 220, ${alfa})`);
      g.addColorStop(1, 'rgba(245, 236, 220, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
    this.quadro = requestAnimationFrame(this.laco);
  };

  destruir() {
    cancelAnimationFrame(this.quadro);
    this.quadro = 0;
    this.visivel = false;
    this.observador?.disconnect();
    window.removeEventListener('resize', this.aoRedimensionar);
  }
}
