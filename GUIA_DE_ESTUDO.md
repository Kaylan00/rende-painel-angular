# Guia de estudo — Rende painel em Angular

Este guia é para você, Kaylan (não é para o recrutador). A ideia: cada conceito que a entrevista do PicPay (Frontend Júnior, Gestão Seller) costuma cobrar aparece neste projeto. Abra o arquivo citado, leia o código com o guia do lado e depois tente explicar em voz alta com suas palavras.

Todos os caminhos abaixo são a partir de `src/app/`.

---

## Parte 1 — Onde cada conceito aparece

### 1. Componentes standalone

Não existe `NgModule` no projeto. Cada componente declara o que usa em `imports: [...]`.

- `features/pedidos/pedidos.component.ts`: veja o `imports` com formulário, tabela, paginação etc.
- `app.ts`: componente raiz só com `<router-outlet />` e `<app-toast />`.

Pontos para falar: standalone é o padrão; menos código; o lazy loading é por componente.

### 2. Signals (`signal`, `computed`, `effect`, `input`, `output`)

- `signal`: `core/notificacao.service.ts` (lista de avisos) e `core/auth/auth.service.ts` (sessão).
- `computed`: `features/recebiveis/recebiveis.component.ts` (totais e agrupamento recalculam sozinhos) e `shared/ui/grafico-barras.component.ts` (altura das barras).
- `effect`: `shared/ui/modal.component.ts` abre/fecha o `<dialog>` quando o signal `aberto` muda.
- `input()` / `input.required()` / `output()`: qualquer componente de `shared/ui/` (ex.: `paginacao.component.ts`).
- `asReadonly()`: em `notificacao.service.ts`, para ninguém de fora alterar o estado.

Regra de bolso: signal para estado que a tela lê na hora; RxJS para o que acontece ao longo do tempo.

### 3. Nova control flow (`@if`, `@for`, `@switch`)

- `@switch` por status de requisição: `features/recebiveis/recebiveis.component.html`.
- `@for` com `track`: `features/pedidos/pedidos.component.html` e `@empty` no mesmo arquivo (botões de ação).
- `@if (x; as y)`: `features/dashboard/dashboard.component.html`.

`track` é obrigatório no `@for` (equivale ao `trackBy`, ajuda o Angular a reaproveitar elementos do DOM).

### 4. Injeção de dependência

- `inject()` em vez de construtor: veja o topo de `features/pedidos/pedidos.component.ts`.
- `providedIn: 'root'`: todos os serviços (`core/api/*.ts`, `auth.service.ts`) são singletons da aplicação.
- Providers globais: `app.config.ts` (router, `provideHttpClient`, `LOCALE_ID`).
- Trocar implementação em teste: `features/pedidos/pedidos.component.spec.ts` usa `{ provide: PedidosService, useValue: api }`.
- Injeção em função (sem classe): `core/auth/auth.guard.ts` e `auth.interceptor.ts` chamam `inject()` dentro da função.

### 5. Router e guards

- Rotas com lazy loading (`loadComponent`) e filhos: `app.routes.ts`.
- Guard funcional que devolve `UrlTree`: `core/auth/auth.guard.ts` (`authGuard` e `visitanteGuard`).
- Título por rota (`title`), redirecionamento (`redirectTo`), rota coringa (`**`): `app.routes.ts`.
- `routerLink` e `routerLinkActive`: `features/shell/shell.component.html`.
- Query param ligado a `input()` com `withComponentInputBinding()`: `app.config.ts` + `features/login/login.component.ts` (`retorno`).
- Navegação por código: `Router.navigateByUrl` no login, `navigate(['/entrar'])` no `AuthService.logout()`.
- Rota pública + rota protegida no mesmo caminho vazio: em `app.routes.ts`, a landing é `path: ''` com `pathMatch: 'full'` e o painel é outro `path: ''` com `canActivate: [authGuard]` e filhos. `/login` virou `redirectTo: 'entrar'`.
- `withViewTransitions()` (fade entre telas) e `withInMemoryScrolling({ anchorScrolling: 'enabled' })` (links `fragment` da landing): `app.config.ts`.
- Teste de rotas com `RouterTestingHarness`: `app.routes.spec.ts`.

### 6. Reactive Forms

- `FormBuilder.nonNullable.group(...)`: `features/login/login.component.ts` e `features/cobranca/nova-cobranca.component.ts`.
- Validadores prontos (`required`, `email`, `minLength`, `maxLength`): login e cobrança.
- **Validador customizado**: `shared/validators/validadores.ts` (`valorMinimo(100)` é uma *fábrica* que devolve um `ValidatorFn`; `cpfOuCnpj` é o validador direto).
- Mostrar erro só depois de tocar (`touched`) + `markAllAsTouched()` ao enviar: `shared/ui/campo-formulario.component.ts` e `pedirConfirmacao()` na cobrança.
- **`ControlValueAccessor`** (máscara de reais): `shared/ui/mascara-moeda.directive.ts`. A tela mostra "R$ 45,90", o `FormControl` guarda `4590`.
- `valueChanges` como stream: filtro de pedidos (`pedidos.component.ts`) e preview da cobrança (`toSignal(this.form.valueChanges...)`).
- `formControlName` e `[formGroup]`: veja `login.component.html`.

### 7. HttpClient e interceptors

- Serviços que só chamam a API: `core/api/pedidos.service.ts`, `core/api/painel.service.ts`.
- `HttpParams` (monta a query string só com filtros preenchidos): `PedidosService.buscar`.
- Interceptor funcional que **clona** o request e põe o token: `core/auth/auth.interceptor.ts`.
- Interceptor que trata erro (`catchError` + `throwError`): `core/erro.interceptor.ts` (401 desloga, 5xx avisa).
- Ordem dos interceptors: `app.config.ts` (`withInterceptors([auth, erro, mock])`).
- "Servidor" falso: `core/mock/mock-api.interceptor.ts` (responde sem chamar a rede, com `delay`, 401 e 409).
- Testes com `HttpTestingController`: `core/auth/auth.spec.ts` e `core/api/pedidos.service.spec.ts`.

### 8. RxJS

- `debounceTime` + `distinctUntilChanged` + `switchMap`: `features/pedidos/pedidos.component.ts` (propriedades `filtro$` e `estado`).
- `combineLatest` de filtro + página + "recarregar".
- `BehaviorSubject`: `pagina$` e `recarregar$` em pedidos; `recarregar$` em dashboard e recebíveis.
- `catchError` dentro do `switchMap` (para o stream não morrer): operador `comEstado()` em `core/utils/estado-requisicao.ts`.
- `startWith`, `map`, `tap`, `switchMap` + `EMPTY`: `pedidos.component.ts` e `campo-formulario.component.ts`.
- `async` pipe: `features/dashboard/dashboard.component.html` (`estado$ | async`).
- `toSignal` / `toObservable` / `takeUntilDestroyed`: pedidos (`toSignal`), login e cobrança (`takeUntilDestroyed`), campo (`toObservable`).
- Teste de debounce e cancelamento com timers falsos: `features/pedidos/pedidos.component.spec.ts`.

### 9. Evitar vazamento de subscription

Nenhum `subscribe` sem dono:

- `toSignal(...)` cancela sozinho ao destruir o componente.
- `| async` também.
- Os poucos `subscribe` manuais (login, mudar status, criar cobrança) têm `.pipe(takeUntilDestroyed(this.destroyRef))`.
- Chamadas HTTP completam sozinhas, mas ainda assim cancelar ao sair da tela evita atualizar uma tela que não existe mais.

### 10. TypeScript

- `strict: true` em `tsconfig.json`.
- Tipos união e literais: `StatusPedido`, `FormaPagamento` em `core/models/pedido.model.ts`.
- `Record<K, V>` para mapas completos (obriga a cobrir todos os casos): `ROTULO_STATUS`, `TAXA_BPS`, `TRANSICOES`.
- União discriminada: `Estado<T>` em `core/utils/estado-requisicao.ts` (`status: 'carregando' | 'ok' | 'erro'`; dentro de `@case ('ok')` o TypeScript sabe que existe `dados`).
- Genéricos: `Pagina<T>`, `Estado<T>`, `comEstado<T>()`, `TabelaComponent<T>`, `Coluna<T>`.
- `interface` vs `type`: interfaces para formas de objeto (`Pedido`), `type` para uniões.
- `keyof`: `Coluna<T>.chave` é `keyof T & string`.
- `as const`, `Partial<T>` (nos testes), `readonly` (campos de serviço).

### 11. CSS responsivo e design system

- Tokens (variáveis CSS): `styles.scss`.
- **Mobile first** com `@media (min-width: ...)`: `features/shell/shell.component.scss` (menu inferior no celular, lateral no desktop).
- **Grid** com `repeat(auto-fit, minmax(...))`: `features/dashboard/dashboard.component.scss`, `pedidos.component.scss`.
- **Flex** (`flex-wrap`, `gap`, `justify-content`): quase todo SCSS, ex.: `dashboard.component.scss` (lista de últimos pedidos).
- Tabela que rola na horizontal no celular: `shared/ui/tabela.component.scss`.
- Acessibilidade: `sr-only`, `:focus-visible`, link "pular conteúdo" (`shell.component.html`), `aria-live`, `<dialog>`, label associado por `for`/`id`.

### 12. Testes (Jest)

- Configuração: `jest.config.js`, `setup-jest.ts`.
- Função pura (mais fácil): `core/utils/moeda.spec.ts`, `core/models/pedido-status.spec.ts`, `shared/validators/validadores.spec.ts`.
- Serviço com HTTP: `core/api/pedidos.service.spec.ts` (`HttpTestingController`).
- Guard e interceptor: `core/auth/auth.spec.ts` (`TestBed.runInInjectionContext`).
- Componente com `TestBed` e serviço falso: `features/login`, `pedidos`, `recebiveis`, `dashboard`, `cobranca` (`*.spec.ts`).
- Timers falsos (`jest.useFakeTimers`) para testar debounce: `pedidos.component.spec.ts`.
- `jest.fn()`, `mockReturnValue`, `jest.spyOn`: em quase todos os specs.

### 13. Dinheiro em centavos

`core/utils/moeda.ts`, `shared/pipes/moeda.pipe.ts` e `shared/ui/mascara-moeda.directive.ts`. Tudo é inteiro; só a tela formata.

### 14. Animação (motion) e diretivas próprias

- Diretiva de atributo com `input()` e `afterNextRender`: `shared/movimento/revelar.directive.ts` (só mexe no DOM depois do Angular desenhar; `DestroyRef.onDestroy` para parar o observador).
- `effect` + `untracked` numa diretiva: `shared/movimento/contador.directive.ts` (reage ao valor novo e conta a partir do anterior).
- Animação infinita que para ao destruir: `shared/movimento/flutuar.directive.ts`.
- Acessibilidade: `movimentoReduzido()` em `shared/movimento/movimento.ts` lê `prefers-reduced-motion`; com ele ligado, nada anima.
- Mock de biblioteca no Jest com `moduleNameMapper`: `jest.config.js` + `testing/motion.mock.ts`.

### 15. Signals numa tela interativa (a fatia do app, na landing)

- `features/landing/fatia/fatia.component.ts`: dois `signal` (faturamento, comissão), um `signal` para o botão “Com o Rende” e um `computed` (`fatia`) com ângulo, tamanho da pizza e valores. O template liga o ângulo a uma variável CSS (`[style.--ang]`) e tudo recalcula ao mexer no slider, sem `subscribe`.
- A conta em si é `calcularFatia()` em `features/landing/fatia/fatia.ts` (função pura, testada em `landing.spec.ts`).

### 16. Biblioteca de animação externa sem vazamento (GSAP + Lenis)

- `features/landing/movimento/rolagem.service.ts`: serviço nos `providers` do componente (não `root`), então vive só enquanto a landing existe.
- `features/landing/palco/palco.component.ts`: `afterNextRender` (só no navegador), `gsap.context(...)` e `ctx.revert()` no `DestroyRef.onDestroy`; timeline com `scrollTrigger: { pin, scrub }`; `signal` do passo atual atualizado pela timeline.
- `features/landing/lojas/lojas.component.ts`: anel 3D em CSS (`preserve-3d`), giro escrito direto no estilo (sem detecção de mudança a cada quadro) e listeners de arrastar removidos ao destruir.
- Testes com mocks por `moduleNameMapper` (`testing/gsap.mock.ts`, `testing/lenis.mock.ts`).
- A conta em si é uma função pura (`features/landing/comparativo.ts`), testada separada da tela (`landing.spec.ts`).

---

## Parte 2 — 15 perguntas de entrevista (com respostas curtas)

**1. O que é um standalone component e por que usar?**
É um componente que declara suas próprias dependências em `imports`, sem `NgModule`. Menos arquivos, lazy loading por componente e menos "magia". No projeto, todos os componentes são standalone (ex.: `PedidosComponent` importa `ReactiveFormsModule`, `TabelaComponent`, `PaginacaoComponent`...).

**2. Qual a diferença entre signal e Observable? Quando usar cada um?**
Signal guarda um valor atual e notifica quem o leu; é síncrono, não tem "completar" nem erro. Observable é um fluxo no tempo (várias emissões, pode falhar, pode ser cancelado). No projeto: `AuthService.token()` é signal (o guard lê na hora); a busca de pedidos é Observable (HTTP, debounce, cancelamento). A ponte é `toSignal`/`toObservable`.

**3. Para que serve `computed` e por que não é só uma função?**
`computed` é um signal derivado e *memoizado*: só recalcula quando um signal que ele leu muda. Em `RecebiveisComponent`, `totalLiquido` e `grupos` dependem de `lista`; se a lista não mudou, nada é recalculado, e o template atualiza sozinho.

**4. Como o Angular injeta dependências? Para que serve `providedIn: 'root'`?**
Há um injetor hierárquico: o componente pede um tipo (com `inject(Tipo)` ou construtor) e o Angular procura o provider mais próximo para cima. `providedIn: 'root'` registra o serviço como singleton global, e ele é "tree-shakable" (sai do bundle se ninguém usar). Em teste, substituo por `{ provide: PedidosService, useValue: falso }`.

**5. Como funciona um guard funcional? E o que ele devolve?**
É uma função `CanActivateFn` que usa `inject()`. Devolve `true` (libera), `false` (bloqueia) ou uma `UrlTree` (redireciona). O `authGuard` do projeto devolve `router.createUrlTree(['/entrar'], { queryParams: { retorno } })` quando não há sessão, para voltar à rota pedida depois do login.

**6. Diferença entre `FormControl` e `FormGroup` e entre Template-driven e Reactive Forms?**
`FormControl` é um campo; `FormGroup` agrupa campos e tem o valor/validade do conjunto. Reactive Forms define o modelo em TypeScript (testável, validadores como funções, `valueChanges` como Observable); template-driven define tudo no HTML com `ngModel`. Usei reativo no login e na cobrança porque tenho validadores customizados e preview em tempo real via `valueChanges`.

**7. Como você cria um validador customizado?**
Uma função que recebe o `AbstractControl` e devolve `null` (válido) ou um objeto de erro. Se precisa de parâmetro, faço uma fábrica que devolve o validador: `valorMinimo(100)` retorna um `ValidatorFn` (arquivo `validadores.ts`). Erro entra em `control.errors`, e o `CampoFormularioComponent` traduz a chave (`valorMinimo`) em mensagem.

**8. O que é um `ControlValueAccessor`?**
É a "ponte" entre um elemento do DOM e um `FormControl`: `writeValue` (modelo → tela), `registerOnChange` (tela → modelo), `registerOnTouched` e `setDisabledState`. Usei na `MascaraMoedaDirective`: o usuário vê "R$ 45,90" e o formulário guarda `4590` centavos.

**9. Como funciona um interceptor funcional? Qual a importância da ordem?**
É uma função `(req, next) => Observable` registrada em `withInterceptors([...])`. Requests são imutáveis, então uso `req.clone({ setHeaders })` para adicionar o token. A ordem importa: a ida passa na ordem do array, a volta na ordem inversa. Aqui: `auth` (põe token) → `erro` (trata 401/500 na volta) → `mock` (responde). Se o mock estivesse antes, o token nunca seria anexado.

**10. Qual a diferença entre `switchMap`, `mergeMap`, `concatMap` e `exhaustMap`? Por que `switchMap` no filtro?**
Todos transformam cada valor em um Observable interno. `switchMap` cancela o anterior quando chega um novo; `mergeMap` roda todos em paralelo; `concatMap` enfileira; `exhaustMap` ignora novos enquanto um roda. Na busca de pedidos quero só o resultado do último filtro, então `switchMap`: a resposta velha é descartada (provado em `pedidos.component.spec.ts`). Para "enviar formulário" eu pensaria em `exhaustMap` (evita duplo clique).

**11. Para que serve `debounceTime` e `distinctUntilChanged` no filtro?**
`debounceTime(300)` espera o usuário parar de mexer por 300 ms antes de buscar, evitando uma requisição por tecla/clique. `distinctUntilChanged` evita buscar de novo se o valor final do filtro é igual ao anterior.

**12. Para que serve `catchError` e onde você o colocou? Por quê?**
Captura o erro e devolve outro Observable. Coloquei **dentro** do `switchMap` (no `comEstado()`), não no fim do pipe: se estivesse fora, o primeiro erro HTTP mataria o stream do filtro e a tela pararia de reagir. Dentro, o erro vira o estado `erro` e o filtro continua funcionando.

**13. Como evitar vazamento de memória com subscriptions?**
Preferir não assinar à mão: `async` pipe e `toSignal` cancelam sozinhos. Quando preciso de `subscribe`, uso `takeUntilDestroyed(destroyRef)`, que completa o stream quando o componente é destruído (feito em login, mudança de status e criação de cobrança). Evito subscribe dentro de subscribe.

**14. O que é `BehaviorSubject` e quando usar em vez de `Subject`?**
É um Subject que guarda o último valor e o entrega imediatamente a quem assina. Útil para estado atual (página 1, "recarregar"). No projeto, `pagina$` e `recarregar$`: o `combineLatest` precisa de um valor inicial de cada fonte para emitir a primeira busca. Um `Subject` comum não tem valor inicial, e o `combineLatest` ficaria esperando.

**15. Por que dinheiro em centavos inteiros e como tipar `Estado<T>` com união discriminada?**
Ponto flutuante erra contas (`0.1 + 0.2 = 0.30000000000000004`); inteiro de centavos é exato, e só formato na tela (`MoedaPipe`). Taxas uso em basis points (399 = 3,99%) e arredondo por venda. Sobre o tipo: `Estado<T>` é `{status:'carregando'} | {status:'ok'; dados:T} | {status:'erro'; mensagem:string}`. O campo `status` discrimina a união: dentro de `@case ('ok')` o TypeScript sabe que existe `dados`, e é impossível ler `dados` no estado de erro.

---

## Perguntas bônus (se sobrar tempo)

- **Zone.js vs zoneless**: o projeto é *zoneless* (sem `zone.js`). A detecção de mudanças roda quando um signal muda, um evento do template dispara ou `markForCheck()` é chamado. Por isso estado em signal é a escolha natural.
- **OnPush**: o componente só é checado quando um input/signal muda ou um evento dele dispara. No Angular 22 já é o padrão. O `CampoFormularioComponent` converte `control.events` em signal para continuar OnPush mesmo com `touched` não sendo signal.
- **Lazy loading**: `loadComponent: () => import(...)` em `app.routes.ts`. Cada tela vira um chunk separado (veja a saída do `npm run build`).
- **`track` no `@for`**: dá identidade aos itens para o Angular não recriar o DOM inteiro a cada mudança.

## Roteiro de 20 minutos para revisar antes da entrevista

1. Rode `npm start`, entre e navegue pelas 5 telas.
2. Abra `app.config.ts` e `app.routes.ts` e explique em voz alta (providers, interceptors, guard, lazy).
3. Abra `pedidos.component.ts` e explique o fluxo `filtro → debounce → combineLatest → switchMap → comEstado → toSignal`.
4. Abra `validadores.ts` e `mascara-moeda.directive.ts`.
5. Rode `npm test` e abra o teste de debounce em `pedidos.component.spec.ts`.
6. Releia as 15 perguntas e responda sem olhar.
