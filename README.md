# Rende — painel do lojista em Angular

Painel de gestão para restaurantes, feito em **Angular 22** (standalone components, signals, nova control flow, RxJS, Reactive Forms, Router com guard funcional, HttpClient com interceptors) e testado com **Jest**.

> **Contexto.** O [Rende](#sobre-o-rende) é um SaaS de delivery que eu criei para restaurantes do interior do Espírito Santo: mensalidade fixa, **sem comissão por pedido**. O produto original (site de pedidos e painel) é feito em **Next.js**. Este repositório é o **painel do lojista reescrito em Angular**, para praticar e demonstrar o framework em um problema real: pedidos, recebíveis e cobranças Pix. Os dados vêm de uma API simulada (mock); não há back-end real aqui.

Restaurante de demonstração: **Bocca Burger**. A raiz (`/`) é a **landing pública do Rende**; o painel fica em `/entrar` → `/dashboard`.

## O que o painel faz

| Tela | O que mostra / permite |
| --- | --- |
| **Landing** (`/`) | Página pública do produto, imersiva: o nome RENDE gigante com um **hambúrguer explodido** em 6 camadas (parallax com o mouse e vapor em canvas); ao rolar, a seção fica presa (GSAP ScrollTrigger) e as camadas **se empilham**, cada uma acendendo um passo do pedido contado com objetos (celular lendo o QR, pedido chegando no painel, comanda saindo da impressora, rota do motoboy no mapa, Pix caindo na conta) e uma linha do tempo. Depois, **“a fatia do app”**: a pizza se monta vista de cima (massa gira, molho em espiral, manjericão cai), um cortador risca a fatia da comissão e ela vai para a sacola do app; sliders ligados a signals/`computed` mudam a fatia ao vivo. **Anel 3D** com 6 lojas de exemplo (HTML real), fundo com o ambiente da loja da frente e pedidos “ao vivo” subindo; o plano é uma **comanda** presa num trilho de cozinha e as dúvidas são **bilhetes** que você puxa (`details`/`summary`). Chamada final para o WhatsApp. |
| **Login** (`/entrar`) | Formulário reativo com validação. Guarda o token e libera as rotas protegidas. |
| **Dashboard** | Vendas do dia, ticket médio, valor a receber, gráfico de vendas (SVG feito à mão) e **receita líquida por forma de pagamento** (Pix, crédito, débito e dinheiro), mostrando a taxa de cada canal e o valor líquido. |
| **Pedidos** | Tabela com filtros (status, forma de pagamento, período) e paginação. A busca usa RxJS (`debounceTime` + `switchMap`). Cada pedido só pode mudar de status seguindo a **máquina de estados**: `aguardando_pagamento → recebido → preparo → pronto → saiu → entregue` (ou `cancelado`, antes de sair da cozinha). |
| **Recebíveis** | Valores de crédito/débito que ainda vão cair na conta, agrupados por data, com totais calculados por `computed` signals. |
| **Nova cobrança** | Cobrança Pix ou link de pagamento: formulário reativo, máscara de reais, validadores customizados (valor mínimo/máximo, CPF/CNPJ), preview em tempo real e confirmação em modal. |

Tudo em português, responsivo (menu inferior no celular, lateral no desktop; no celular a tabela de pedidos vira blocos com rótulo e valor) e com cuidados de acessibilidade: labels associados, foco visível, link “pular para o conteúdo”, `aria-live` nas mudanças de estado, contraste mínimo 4,5:1 e alvos de toque de 44 px.

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
- [motion](https://motion.dev) para animação (diretivas `appRevelar`, `appContador`, `appFlutuar`) e View Transitions do router entre telas
- GSAP 3 + ScrollTrigger e Lenis (rolagem suave) só na landing, encapsulados em serviço/componentes e destruídos ao sair da página
- Fontes Gambetta (títulos) e General Sans (interface e números tabulares), do Fontshare, servidas localmente
- Jest 30 + jest-preset-angular (125 testes) e `HttpTestingController`
- ESLint com `angular-eslint` (regras de acessibilidade de template incluídas)

## Como rodar

Pré-requisito: **Node 22.22.3 ou superior** (exigência do Angular CLI 22).

```bash
npm install
npm start          # http://localhost:4200 (landing); painel em /entrar
```

Entre com **qualquer e-mail válido e senha com 6 ou mais caracteres** (é uma demonstração).

Outros comandos:

```bash
npm test           # Jest (125 testes)
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
    movimento/             # diretivas de animação com motion (revelar,
                           # contador, flutuar) e prefers-reduced-motion
  features/                # uma pasta por tela (landing, login, shell, dashboard,
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

**Guard funcional.** `authGuard` devolve uma `UrlTree` para `/entrar?retorno=...`, e o login volta para a rota pedida (`withComponentInputBinding` liga o query param ao `input()`). `visitanteGuard` impede quem já entrou de ver o login.

**OnPush em tudo.** No Angular 22 o padrão já é OnPush. O campo de formulário usa `controle.events` virado em signal para reagir a *touched/errors* sem abrir mão de OnPush.

**Mini design system.** Tokens em variáveis CSS (`--cor-primaria`, `--espaco-*`, `--raio`...) em `styles.scss`; os componentes só consomem tokens. Um tema escuro seria só redefinir as variáveis. O modal usa o `<dialog>` nativo (foco preso, Esc e backdrop de graça).

**Animação com propósito (motion).** Três diretivas pequenas em `shared/movimento/`: `appRevelar` (o bloco entra ao chegar na tela, com `inView`; `appRevelar="filhos"` faz os filhos entrarem em sequência com `stagger`), `appContador` (o número conta até o valor final; o texto final é escrito na hora e a animação vai por cima, então leitor de tela e teste sempre veem o valor certo) e `appFlutuar` (os cartões do topo da landing sobem e descem devagar). O gráfico de barras cresce da base. Entre rotas, `withViewTransitions()` faz um fade curto. Com `prefers-reduced-motion`, nada disso roda. No Jest, `motion` é trocado por um mock (`testing/motion.mock.ts` via `moduleNameMapper`).

**A fatia do app com signals.** Os sliders escrevem em dois `signal` (faturamento e comissão); `computed` chama a função pura `calcularFatia()` (que usa `compararCustos()`, em centavos inteiros) e devolve o ângulo da fatia (27% = 97,2°), o tamanho da pizza e os valores. O ângulo vira a variável CSS `--ang`, usada numa máscara `conic-gradient`: a fatia muda de tamanho ao vivo, sem canvas. O botão “Com o Rende” é outro `signal` que devolve a fatia para a pizza e conta quanto sobra por mês e por ano.

**Landing com GSAP sem vazamento.** `RolagemService` (Lenis ligado ao `gsap.ticker`) fica nos `providers` da `LandingComponent`: nasce e morre com a página. Cada seção cria seus gatilhos dentro de `afterNextRender` (só no navegador) e num `gsap.context`, desfeito no `DestroyRef.onDestroy`. A montagem do hambúrguer é uma timeline com `scrub` e `pin`; o passo atual da jornada é um `signal` atualizado pelo tempo da timeline, e o resto (cartão do painel, Pix contando) reage por CSS e `appContador`. Sem JavaScript ou com `prefers-reduced-motion`, nada é preso nem escondido: o hambúrguer fica explodido no topo e a jornada aparece inteira logo abaixo. No Jest, `gsap`, `gsap/ScrollTrigger` e `lenis` são mocks (`testing/`).

**Não é over-engineering de propósito.** Sem NgRx, sem biblioteca de UI, sem camadas extras: serviços, componentes e funções pequenas, fáceis de ler.

## Testes

125 testes em 16 arquivos, cobrindo:

- utilitários e pipe de moeda, arredondamento de taxas;
- máquina de estados do pedido e receita líquida por canal;
- validadores (valor mínimo/máximo, CPF, CNPJ);
- `AuthService`, `authGuard`, `visitanteGuard`, `authInterceptor`, `erroInterceptor`;
- `PedidosService` (parâmetros HTTP) e o back-end mock (401, 409, paginação, filtros);
- rotas (landing pública, painel protegido, `/login` → `/entrar`);
- landing: fatia do app (`calcularFatia`: ângulo, tamanho da pizza, valores; sliders e botão “Com o Rende”), comparação de custos, camadas e passos da montagem, loja de frente no anel 3D, versão sem movimento (nada preso), pin e limpeza do GSAP/Lenis ao destruir, links de WhatsApp e texto alternativo das fotos;
- diretivas de animação (com e sem `prefers-reduced-motion`);
- componentes: login, dashboard, pedidos (debounce e cancelamento por `switchMap` provados com timers falsos), recebíveis, nova cobrança (máscara, validação, modal, envio) e os componentes do design system.

### Observação sobre o Jest

O Angular CLI 22 só oferece Karma e Vitest no `ng new`, então o Jest foi configurado manualmente (`jest.config.js`, `setup-jest.ts`, `jest-preset-angular` 17 em modo *zoneless*) e `npm test` roda `jest`. Funcionou sem adaptações.

## Fontes e fotos

- **Gambetta** e **General Sans**, do [Fontshare](https://www.fontshare.com) (ITF Free Font License), em `public/fonts/`.
- Fotos reais do [Unsplash](https://unsplash.com) (licença Unsplash), em `src/assets/fotos/`, usadas nos celulares das lojas: amirali mirhashemian (hamburgueria), Aurélien Lemasson-Théobald (pizzaria), Vicky Ng (açaiteria) e Mae Mu (padaria).
- Imagens geradas por IA (Codex): camadas do hambúrguer (`src/assets/hamburguer/`), pizza vista de cima, massa, manjericão, cortador e sacola sem marca (`src/assets/pizza/`), ambientes das lojas (`src/assets/ambiente/`) e os pratos da marmitaria e da pastelaria (`src/assets/fotos/`). Sem pessoas.
- Lojas da landing (Forno da Praça, Açaí do Porto, Padaria Dona Lia), preço (R$ 129/mês) e textos de dúvidas são de demonstração. O link de WhatsApp abre a conversa com a mensagem pronta; para fixar um número, troque `LINK_WHATSAPP` em `features/landing/conteudo.ts`.

## O que ficou de fora (de propósito)

- Back-end real, autenticação de verdade e QR Code Pix real (o QR do preview é só uma ilustração gerada do texto).
- Internacionalização completa e tema escuro (a base de tokens já permite).
- Testes end-to-end.

---

Feito por **Kaylan** como projeto de portfólio.
