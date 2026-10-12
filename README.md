# Rende — painel do lojista em Angular

Painel de gestão para restaurantes, feito em **Angular 22** (standalone components, signals, nova control flow, RxJS, Reactive Forms, Router com guard funcional, HttpClient com interceptors) e testado com **Jest**.

> **Contexto.** O [Rende](#sobre-o-rende) é um SaaS de delivery que eu criei para restaurantes do interior do Espírito Santo: mensalidade fixa, **sem comissão por pedido**. O produto original (site de pedidos e painel) é feito em **Next.js**. Este repositório é o **painel do lojista reescrito em Angular**, para praticar e demonstrar o framework em um problema real: pedidos, recebíveis e cobranças Pix. Os dados vêm de uma API simulada (mock); não há back-end real aqui.

Restaurante de demonstração: **Bocca Burger**.

## O que o painel faz

| Tela | O que mostra / permite |
| --- | --- |
| **Login** | Formulário reativo com validação. Guarda o token e libera as rotas protegidas. |
| **Dashboard** | Vendas do dia, ticket médio, valor a receber, gráfico de vendas (SVG feito à mão) e **receita líquida por forma de pagamento** (Pix, crédito, débito e dinheiro), mostrando a taxa de cada canal e o valor líquido. |
| **Pedidos** | Tabela com filtros (status, forma de pagamento, período) e paginação. A busca usa RxJS (`debounceTime` + `switchMap`). Cada pedido só pode mudar de status seguindo a **máquina de estados**: `aguardando_pagamento → recebido → preparo → pronto → saiu → entregue` (ou `cancelado`, antes de sair da cozinha). |
| **Recebíveis** | Valores de crédito/débito que ainda vão cair na conta, agrupados por data, com totais calculados por `computed` signals. |
| **Nova cobrança** | Cobrança Pix ou link de pagamento: formulário reativo, máscara de reais, validadores customizados (valor mínimo/máximo, CPF/CNPJ), preview em tempo real e confirmação em modal. |

Tudo em português, responsivo (menu inferior no celular, lateral no desktop) e com cuidados de acessibilidade: labels associados, foco visível, link “pular para o conteúdo”, `aria-live` nas mudanças de estado, contraste mínimo 4,5:1 e alvos de toque de 44 px.

## Sobre o Rende

- Mensalidade fixa, sem comissão sobre as vendas.
- Diferencial: **receita líquida por forma de pagamento**. O lojista enxerga quanto realmente fica depois da taxa de cada canal (taxas das operadoras: Pix 0,99%, débito 1,89%, crédito 3,99%, dinheiro 0%; valores de demonstração).
- Pedidos seguem uma máquina de estados explícita, para nunca existir um pedido “entregue” que ainda estava aguardando pagamento.
- **Dinheiro sempre em centavos inteiros**, formatado só na hora de mostrar.

## Stack

- Angular 22 (standalone, signals, `@if` / `@for` / `@switch`, `input()` / `output()`, zoneless)
- TypeScript em modo `strict`
- RxJS 7 (`switchMap`, `debounceTime`, `combineLatest`, `BehaviorSubject`, `catchError`, `toSignal`, `takeUntilDestroyed`, `async` pipe)
- SCSS com tokens CSS (mini design system próprio, sem biblioteca de UI)
- Jest 30 + jest-preset-angular (76 testes) e `HttpTestingController`
- ESLint com `angular-eslint` (regras de acessibilidade de template incluídas)

## Como rodar

Pré-requisito: **Node 22.22.3 ou superior** (exigência do Angular CLI 22).

```bash
npm install
npm start          # http://localhost:4200
```

Entre com **qualquer e-mail válido e senha com 6 ou mais caracteres** (é uma demonstração).

Outros comandos:

```bash
npm test           # Jest (76 testes)
npm run lint       # ESLint
npm run build      # build de produção em dist/
```

Para ver o estado de erro das telas, rode no console do navegador `localStorage.setItem('rende.simularFalha','1')` e recarregue (a API mock passa a responder 500 no dashboard e nos pedidos). `localStorage.removeItem('rende.simularFalha')` volta ao normal.

## Estrutura

```
src/app/
  core/                    # regras e infraestrutura, sem tela
    auth/                  # AuthService (signals), authGuard, authInterceptor
    api/                   # PedidosService, PainelService (HttpClient)
    mock/                  # "back-end" falso: interceptor + dados + cálculos
    models/                # tipos e a máquina de estados do pedido
    utils/                 # dinheiro em centavos, datas, estado de requisição
    erro.interceptor.ts    # 401/500 -> aviso (toast) e logout
    notificacao.service.ts # toasts com signals
  shared/
    ui/                    # botão, card de métrica, tabela, paginação, badge,
                           # modal, campo de formulário, máscara de moeda,
                           # gráfico de barras (SVG), QR placeholder, toast
    validators/            # valorMinimo, valorMaximo, cpfOuCnpj
    pipes/                 # moeda
  features/                # uma pasta por tela (login, shell, dashboard,
                           # pedidos, recebiveis, cobranca), cada uma lazy
  app.config.ts            # providers: router, http + interceptors, locale pt-BR
  app.routes.ts            # rotas com loadComponent e guards
src/styles.scss            # tokens do design system
```

## Decisões técnicas

**Dinheiro em centavos inteiros.** Todo valor monetário é um `number` inteiro de centavos; `0.1 + 0.2` nunca aparece. Taxas são calculadas em *basis points* (399 = 3,99%) e arredondadas por venda, como a operadora cobra. Só o `MoedaPipe` e `formatarMoeda()` transformam em “R$ 12,34”. A máscara de campo (`appMascaraMoeda`) é um `ControlValueAccessor`: o usuário digita reais, o `FormControl` guarda centavos.

**Signals ou BehaviorSubject? Os dois, cada um onde faz sentido.**
- *Signals* para estado síncrono e de leitura imediata: sessão (`AuthService`), avisos (`NotificacaoService`), totais de recebíveis (`computed`), preview da cobrança, controle de modal. O guard e o interceptor leem `auth.token()` na hora, sem `subscribe`.
- *RxJS* para o que é assíncrono ou depende do tempo: chamadas HTTP, debounce do filtro, cancelamento de busca antiga (`switchMap`), `BehaviorSubject` para página atual e botão “tentar novamente” (guarda o último valor e emite ao assinar). `toSignal` faz a ponte e cancela a assinatura sozinho quando o componente morre.

**Sem vazamento de subscription.** Nenhum `subscribe` solto: `toSignal`, `async` pipe (dashboard) e `takeUntilDestroyed` (login, mudança de status, criação de cobrança).

**Estado de tela explícito.** O operador `comEstado()` transforma um `Observable<T>` em `carregando | ok | erro`, com `catchError` por dentro para o erro não matar o stream. Todas as telas tratam carregando, vazio e erro (com “tentar novamente”).

**Interceptors funcionais em ordem.** `authInterceptor` (token) → `erroInterceptor` (401 desloga e avisa; 5xx avisa) → `mockApiInterceptor` (faz o papel do servidor). Para usar uma API real basta tirar o último da lista em `app.config.ts`.

**API mock por interceptor, não json-server.** O projeto roda só com `npm start`, sem segundo processo. O mock responde com latência simulada, valida token (401), valida transições de status (409) e calcula dashboard e recebíveis em funções puras testadas.

**Guard funcional.** `authGuard` devolve uma `UrlTree` para `/login?retorno=...`, e o login volta para a rota pedida (`withComponentInputBinding` liga o query param ao `input()`). `visitanteGuard` impede quem já entrou de ver o login.

**OnPush em tudo.** No Angular 22 o padrão já é OnPush. O campo de formulário usa `controle.events` virado em signal para reagir a *touched/errors* sem abrir mão de OnPush.

**Mini design system.** Tokens em variáveis CSS (`--cor-primaria`, `--espaco-*`, `--raio`...) em `styles.scss`; os componentes só consomem tokens. Um tema escuro seria só redefinir as variáveis. O modal usa o `<dialog>` nativo (foco preso, Esc e backdrop de graça).

**Não é over-engineering de propósito.** Sem NgRx, sem biblioteca de UI, sem camadas extras: serviços, componentes e funções pequenas, fáceis de ler.

## Testes

76 testes em 13 arquivos, cobrindo:

- utilitários e pipe de moeda, arredondamento de taxas;
- máquina de estados do pedido e receita líquida por canal;
- validadores (valor mínimo/máximo, CPF, CNPJ);
- `AuthService`, `authGuard`, `visitanteGuard`, `authInterceptor`, `erroInterceptor`;
- `PedidosService` (parâmetros HTTP) e o back-end mock (401, 409, paginação, filtros);
- componentes: login, dashboard, pedidos (debounce e cancelamento por `switchMap` provados com timers falsos), recebíveis, nova cobrança (máscara, validação, modal, envio) e os componentes do design system.

### Observação sobre o Jest

O Angular CLI 22 só oferece Karma e Vitest no `ng new`, então o Jest foi configurado manualmente (`jest.config.js`, `setup-jest.ts`, `jest-preset-angular` 17 em modo *zoneless*) e `npm test` roda `jest`. Funcionou sem adaptações.

## O que ficou de fora (de propósito)

- Back-end real, autenticação de verdade e QR Code Pix real (o QR do preview é só uma ilustração gerada do texto).
- Internacionalização completa e tema escuro (a base de tokens já permite).
- Testes end-to-end.

---

Feito por **Kaylan** como projeto de portfólio.
