import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { Cobranca, NovaCobranca, Sessao } from '../models/painel.model';
import { podeTransicionar } from '../models/pedido-status';
import { FormaPagamento, Pedido, StatusPedido } from '../models/pedido.model';
import { isoParaDataLocal, paraDataLocal } from '../utils/datas';
import { montarDashboard, montarRecebiveis } from './mock-calculos';
import { gerarPedidos, LOJISTA_MOCK } from './mock-dados';

/**
 * "Back-end" falso: um interceptor que responde às chamadas /api/* com dados
 * em memória, no lugar de um json-server. Assim o app roda só com `npm start`.
 * Para trocar por uma API real, basta tirar este interceptor do app.config.ts.
 */

const TOKEN_FAKE = 'rende-token-fake-123';
const LATENCIA_MS = 350;

// "banco de dados" em memória (vive enquanto a aba estiver aberta)
let pedidos: Pedido[] = gerarPedidos();
const cobrancas: Cobranca[] = [];

export function reiniciarMock() {
  pedidos = gerarPedidos();
  cobrancas.length = 0;
}

function responder<T>(corpo: T, status = 200, latencia = LATENCIA_MS): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status, body: corpo })).pipe(delay(latencia));
}

function falhar(status: number, mensagem: string, latencia = LATENCIA_MS): Observable<never> {
  return timer(latencia).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { mensagem } }))),
  );
}

function simularFalha(): boolean {
  try {
    return localStorage.getItem('rende.simularFalha') === '1';
  } catch {
    return false;
  }
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }
  const caminho = req.url.split('?')[0];

  if (caminho === '/api/login' && req.method === 'POST') {
    const { email, senha } = req.body as { email: string; senha: string };
    if (!email.includes('@') || senha.length < 6) {
      return falhar(401, 'E-mail ou senha inválidos.');
    }
    const sessao: Sessao = { token: TOKEN_FAKE, lojista: LOJISTA_MOCK };
    return responder(sessao);
  }

  if (req.headers.get('Authorization') !== `Bearer ${TOKEN_FAKE}`) {
    return falhar(401, 'Sessão inválida.', 100);
  }

  if (caminho === '/api/dashboard' && req.method === 'GET') {
    return simularFalha() ? falhar(500, 'Erro simulado.') : responder(montarDashboard(pedidos));
  }
  if (caminho === '/api/pedidos' && req.method === 'GET') {
    return simularFalha() ? falhar(500, 'Erro simulado.') : listarPedidos(req);
  }
  const mudancaStatus = caminho.match(/^\/api\/pedidos\/(\d+)\/status$/);
  if (mudancaStatus && req.method === 'PATCH') {
    return mudarStatus(Number(mudancaStatus[1]), (req.body as { status: StatusPedido }).status);
  }
  if (caminho === '/api/recebiveis' && req.method === 'GET') {
    return responder(montarRecebiveis(pedidos, paraDataLocal(new Date())));
  }
  if (caminho === '/api/cobrancas' && req.method === 'POST') {
    return criarCobranca(req.body as NovaCobranca);
  }
  return falhar(404, 'Rota não encontrada.', 50);
};

function listarPedidos(req: HttpRequest<unknown>) {
  const p = req.params;
  const status = p.get('status');
  const forma = p.get('forma') as FormaPagamento | null;
  const de = p.get('de');
  const ate = p.get('ate');
  const pagina = Number(p.get('pagina') ?? 1);
  const porPagina = Number(p.get('porPagina') ?? 8);

  const filtrados = pedidos
    .filter((x) => (!status || x.status === status) && (!forma || x.formaPagamento === forma))
    .filter((x) => {
      const dia = isoParaDataLocal(x.criadoEm);
      return (!de || dia >= de) && (!ate || dia <= ate);
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const inicio = (pagina - 1) * porPagina;
  return responder({ itens: filtrados.slice(inicio, inicio + porPagina), total: filtrados.length, pagina, porPagina });
}

function mudarStatus(id: number, novo: StatusPedido) {
  const pedido = pedidos.find((x) => x.id === id);
  if (!pedido) return falhar(404, 'Pedido não encontrado.');
  if (!podeTransicionar(pedido.status, novo)) {
    return falhar(409, `Não é possível ir de "${pedido.status}" para "${novo}".`);
  }
  pedido.status = novo;
  return responder({ ...pedido });
}

function criarCobranca(dados: NovaCobranca) {
  if (!dados.valorCentavos || dados.valorCentavos < 100) {
    return falhar(422, 'Valor mínimo de R$ 1,00.');
  }
  const codigo = Math.random().toString(36).slice(2, 8).toUpperCase();
  const cobranca: Cobranca = {
    ...dados,
    id: `cob_${cobrancas.length + 1}`,
    codigo,
    url: `https://pay.rende.app/c/${codigo}`,
    criadaEm: new Date().toISOString(),
  };
  cobrancas.push(cobranca);
  return responder(cobranca, 201);
}
