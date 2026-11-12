# Design System — baseado em `/dashboard`

Este documento extrai o visual da rota `/dashboard` (a "Visão mensal"), que já está com a UI reformulada. Ele serve de **referência para reformular as outras páginas** (`transactions`, `credit-card`, `budgets`, `recurring`, `projected-balance`, `investments`, `housing`, `goals`, `reports`, `calculators`, `settings`, `help`).

Fontes: `app/(finance)/dashboard/page.tsx`, `components/finance/dashboard-*.tsx`, `app/globals.css`, `components/ui/button.tsx`, `components/finance/app-shell.tsx`, `components/finance/finance-sidebar.tsx`.

Regras do projeto que continuam valendo (ver `AGENTS.md`): reutilizar componentes shadcn de `components/ui`, nunca criar componentes auxiliares dentro de outro componente, e nunca declarar interfaces/types dentro de componentes (ficam em `lib/interfaces/*`).

---

## 1. Princípios

1. **Cards brancos sobre fundo cinza-quente.** Todo conteúdo vive em cards de borda fina e cantos bem arredondados (`rounded-[20px]`). Sem sombra nos cards; a única elevação é a do painel de conteúdo inteiro.
2. **O número é o herói.** Cada card abre com um título pequeno, um valor monetário grande e em negrito, e só depois detalhes.
3. **Ilustração 3D por card.** Cada card traz um ícone 3D (webp) no canto superior direito, com sombra elíptica borrada embaixo. É a assinatura visual do app.
4. **Azul é a marca; rosa é o contraste.** Azul (`--chart-1` / `primary`) é a cor principal; rosa (`--chart-2`) é a segunda série; verde só para positivo/saldo livre; vermelho só para negativo/alerta.
5. **Hierarquia por tamanho e peso, não por cor.** Texto secundário é cinza; o que importa é `content-strong` em semibold/bold.
6. **Privacidade financeira em tudo.** Todo valor passa por `useFinancialFormatter` (`formatCurrency`, `protect`) ou `DashboardCardsMoney`. Nome vindo do usuário leva `data-user-content`.
7. **Light e dark são iguais em estrutura.** Só os tokens mudam; nunca use cor fixa que quebre em um dos temas.

---

## 2. Layout geral (app shell)

- **Moldura azul**: o fundo da janela é o gradiente da marca (`--hero-from` → `--hero-to`, classe `app-shell-frame`), visível ao redor do painel em ≥ `lg`.
- **Sidebar** (`.sidebar-surface`): sobre o azul, 238px (64px recolhida), item ativo em pílula branca com texto escuro, demais itens em branco translúcido. Logo `finance` + botão circular de recolher no topo, busca (`Ctrl K`), grupos "Análise", rodapé com usuário.
- **Painel de conteúdo**: `bg-surface`, `lg:rounded-[28px]`, `border`, `shadow-elevation`, margem `lg:my-2 lg:mr-2`, padding `px-4 py-6 md:px-7`, em desktop `pl-[29px] pr-[47px] pt-8 pb-[106px]`.
- **Mobile (< lg)**: sidebar some; entra um header em card com marca, busca, privacidade, usuário e menu.
- **Banner demo**: faixa `warning` arredondada acima do conteúdo.

### Estrutura de página

```
<div className="space-y-6">              // 5 em telas ≥ 1601px
  <header>  título + subtítulo | ações (mês, botões)
  <grid>    seções de cards
```

- **Header da página**: `h1` com `text-[35px] leading-[44px] font-semibold tracking-[-1px]`; subtítulo logo abaixo com `mt-2 text-xs text-content`. Ações alinhadas à direita (`flex-wrap`, `gap-3`): `MonthPickerField` (188px) + botões `secondary`.
- **Altura mínima do header** `min-h-[104px]` (76px em ≥ 1601px) para a página não "pular" entre rotas.
- **Grid principal**: duas colunas `xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]` (≈ 64% / 36%). Gap `gap-6` (`gap-5` em ≥ 1601px).
- Abaixo de `xl` tudo empilha em uma coluna.
- Breakpoint custom para telas grandes: `min-[100.0625rem]` (≈ 1601px) reduz espaçamentos e alturas (densidade maior).

---

## 3. Tokens

Tudo definido em `app/globals.css`. **Use os tokens semânticos; não escreva hex nas páginas.**

### Superfícies e texto

| Token (Tailwind) | Light | Dark | Uso |
|---|---|---|---|
| `bg-surface` / `background` | `#f5f5f3` | `#171819` | fundo do painel |
| `bg-card` / `surface-raised` | `#ffffff` | `#202223` | cards |
| `bg-muted` / `surface-elevated` | `#f0f0ee` | `#2a2c2e` | trilhos, hover, tiles inativos |
| `border` | `#e2e2de` | `#37393c` | toda borda |
| `text-content-strong` | `#161616` | `#f1f1ef` | títulos, valores |
| `text-content` | `#666666` | `#b4b5b8` | texto corrente, legendas |
| `text-content-muted` | `#8a8a8a` | `#9b9da1` | descrições de card |
| `text-content-subtle` | `#929292` | `#929599` | eixos, percentuais auxiliares |

### Marca e estado

| Token | Light | Dark | Uso |
|---|---|---|---|
| `primary` / `brand` | `#2f73df` | `#2f73df` / `#79a9ef` | ação principal, aba ativa, destaque |
| `brand-strong` | `#1d4f9b` | `#aecbf5` | azul escuro |
| `success` | `#24915a` | `#70c795` | positivo, saldo livre |
| `destructive` / `danger` | `#dc6565` | `#ee8b8b` | negativo, acima da referência |
| `warning` | `#b87509` | `#f5be60` | demo, avisos |
| `income` / `expense` / `invest` / `redeem` | verde / vermelho / roxo / laranja | versões claras | tons semânticos de dinheiro |

### Paleta de gráficos

`--chart-1` azul `#2f73df` · `--chart-2` rosa `#ff3b6b` · `--chart-3` azul claro `#79a9ef` · `--chart-4` verde `#24915a` · `--chart-5` azul escuro `#1d4f9b`.
Auxiliares: `--chart-surface` (fundo da área do gráfico), `--chart-grid` (linhas), `--chart-rail` (trilho de barras), `--chart-neutral` (série "Saldo").

Ordem categórica fixa (`dashboardCategoryColors`): azul → rosa → azul claro → verde → azul escuro. Use sempre nessa ordem para categorias.

### Tons categóricos

Classes `tone-1..8`, `tone-brand/success/danger/warning/violet/neutral` definem `--tone`, consumido por `tone-soft`, `tone-text`, `tone-fill`, `tone-ring`, `tone-track`, `tone-stripes`. Use para chips/avatares de categoria em vez de cores soltas.

### Raios, sombras, tipografia

- Raio base `--radius: 0.625rem` (10px). Escala: card `20px`, painel `28px`, tile/aba `14px`, botão `10px`, ícone-tile `12px` (`rounded-xl`), barra de progresso `rounded-full`.
- Sombras: cards **não têm**; apenas `shadow-elevation` no painel. Ilustrações usam sombra elíptica manual (ver §5).
- Fonte: **Inter** (`font-sans` e `font-heading`). Mono: SFMono/Consolas.

---

## 4. Escala tipográfica

| Papel | Classes | Exemplo |
|---|---|---|
| Título da página | `text-[35px] leading-[44px] font-semibold tracking-[-1px]` | "Visão mensal" |
| Valor herói (card grande) | `text-[48px] leading-[52px] font-bold` | Saldo previsto |
| Valor de card | `text-[40px] leading-[44px] font-bold` | Cartões, Contas, Investimentos, Moradia |
| Título de card (tipo A) | `text-sm font-semibold text-content-strong` | "Saldo previsto", "Cartões" |
| Título de card (tipo B, com gráfico) | `text-lg font-semibold` / `text-xl leading-[27px]` | "Gastos por categoria", "Evolução mensal" |
| Valor secundário | `text-xl font-semibold` / `text-[15px] font-semibold` | médias, legenda |
| Item de lista | `text-[13px]` (`font-semibold` no valor) | linhas de contas, investimentos |
| Texto de apoio | `text-xs text-content` | "valor estimado após pagar…" |
| Descrição de card | `text-xs`/`text-[13px] text-content-muted` | "Peso relativo das despesas no mês" |
| Micro-rótulo de seção | `text-[10px] font-bold tracking-wider uppercase text-content` | "ONDE ESTÁ O DINHEIRO", "PRÓXIMAS FATURAS" |
| Micro-texto | `text-[11px]` / `text-[10px]` | eixos, percentuais |

**Valores monetários grandes** usam `DashboardCardsMoney`: parte inteira grande, centavos em `0.4em` semibold (`R$ 3.629,70` com `,70` pequeno), `tracking-tight`. Quando a privacidade está ligada renderiza o texto protegido inteiro.

> Atenção: o dashboard usa tamanhos arbitrários (`text-[13px]`, `text-[40px]`). Ao replicar, siga a tabela acima em vez de inventar novos tamanhos.

---

## 5. Anatomia de um card

Dois tipos de card coexistem. **Todo card novo deve ser um dos dois.**

### Tipo A — Card de métrica (topo do dashboard)

```
section.@container.min-w-0.rounded-[20px].border.border-border.bg-card.p-[23px]
├─ h2  text-sm font-semibold text-content-strong        ← título
├─ div.mt-4.flex.justify-between                         ← valor herói + ilustração
│   ├─ rótulo (text-xs text-content) + DashboardCardsMoney (40px bold)
│   └─ ilustração 3D (§5.1)
├─ indicador de status  (text-xs, ícone + cor success/destructive)
├─ visual de dados  (barra, meter, abas, trilho)
├─ micro-rótulo uppercase (mt-6)
└─ lista de itens (divide-y border-border)
```

Padding `p-[23px]` (`p-5` em ≥ 1601px). Usa `@container` para o conteúdo responder à largura do card (ex.: `@md:grid-cols-2`).

### Tipo B — Card de gráfico

```
section.relative.rounded-[20px].border.border-border.bg-card.px-[22px].pt-5.pb-6
├─ DashboardCardIllustration (absolute top-2 right-5, 58px)
├─ h2 text-lg font-semibold
├─ p  mt-1 text-xs text-content-muted
└─ conteúdo (gráfico/barras)
```

Alturas fixas em `xl` para alinhar linhas: `xl:h-[340px]` (categorias) e `xl:h-[704px]` (evolução); em ≥ 1601px `290px` / `600px`.

### 5.1 Ilustração 3D (assinatura)

- Arquivos em `public/images/*.webp`: `balance-wallet`, `bills-calendar`, `category-tag`, `evolution-chart`, `expenses-pie`, `housing-house`, `investments-chart`. **Cada página nova precisa de uma ilustração no mesmo estilo** (3D, fundo transparente, ~450px).
- Card tipo B: componente `DashboardCardIllustration` — `absolute top-2 right-5 size-[58px]`, `pointer-events-none`, `aria-hidden`.
- Card tipo A: ilustração inline à direita do valor (≈ 72–96px), `relative -my-5/-my-6 -mr-2`, `shrink-0`.
- Sempre: `<Image … alt="" unoptimized>` + sombra elíptica sob ela:
  `absolute inset-x-2 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]`.
- Inclinações decorativas só no wallet (`-rotate-[24deg] skew-x-[-8deg]`) e no mini-cartão do header de Cartões.

---

## 6. Componentes e padrões

### Botões (`components/ui/button.tsx`)

- `default`: azul `primary`. `secondary`: fundo `muted`, usado nas ações do header ("Cadastrar conta/categoria", `h-10`, `rounded-[10px]`, `text-[13px] font-medium`, ícone `size-[17px]` com `gap-[10px]`). `outline`: borda + fundo card ("Ver fatura"). `icon-sm` + `rounded-full` para setas de carrossel.
- Link de navegação em card: botão `outline` pequeno `rounded-lg border px-3 py-1.5 text-xs font-semibold` ("Ver investimentos").

### Seletor de mês

`MonthPickerField` (`components/ui/month-picker-field.tsx`), 188px, alinhado ao fim, grava `?month=YYYY-MM` via `router.replace`. **Toda página com dado mensal usa o mesmo componente no header.**

### Barra segmentada (Saldo previsto)

`h-2.5 rounded-full bg-surface gap-0.5`, segmentos com largura em `%`. Cores: fixos `#1d4f9b`, variáveis `chart-1`, investimentos `chart-3`, livre `success`. Legenda em `dl` de 5 colunas (`sm:grid-cols-5`): rótulo com bolinha `size-2` + valor `text-[15px] font-semibold` + percentual `text-[11px] text-content-subtle`. Prefixo `= ` no saldo livre e `− ` nas saídas.

### Barra dividida (Investimentos)

`h-6 rounded-md`, dois blocos coloridos (azul `primary`, rosa `#ff3b6b`) com `%` em branco dentro; divisor preto de 2px entre eles.

### Meter com referência (Moradia)

Trilho `h-3.5 rounded-full bg-surface`, preenchimento `success` (ou `destructive` se acima da referência), marcador vertical `w-0.5 bg-content-strong` na posição de referência, rótulo da referência acima, extremos `0%` e `60% do salário` abaixo (`text-[10px]`). Linha de status acima: ícone `Check`/`TriangleAlert` + `font-semibold` + referência em `text-content`.

### Abas de dia (Contas a pagar)

`role="tablist"`, 5 colunas, tile `h-[58px] rounded-[14px] border`. Ativo: `bg-primary text-primary-foreground border-primary`; inativo: `bg-card hover:bg-muted`. Pontinhos (`size-1`) abaixo do número indicam quantas contas há no dia (máx. 5). Setas `icon-sm rounded-full` quando há mais dias.

### Lista com divisores

`ul.divide-y.divide-border` (ou `border-b last:border-b-0`), linha `py-2.5`–`py-3.5`, `text-[13px]`, valor à direita `font-semibold`. Rolagem interna com `max-h-[260px] overflow-y-auto`. Ação de linha: checkbox circular `size-[18px] border-[1.5px]`, hover azul.

### Itens com ícone (Moradia)

`li` em grid 1→2 colunas (`@md:grid-cols-2`), ícone em tile `size-10 rounded-xl bg-primary/10 text-primary` (ícone `size-[18px]`), rótulo `text-xs text-content`, valor `text-[13px] font-semibold`.

### Cartão de crédito

`CreditCardVisual`: `h-[172px] rounded-[14px]`, tema por bandeira (`CARD_BRAND_THEMES`), chip, badge Aberta/Paga, vencimento e fatura nos cantos inferiores, sombra elíptica embaixo. Carrossel com `translateX` e `--card-w: min(300px, 84cqw)`. Próximas faturas: 3 tiles `rounded-[14px] border-2`, selecionado com `border-brand` + preenchimento `bg-brand/10` e pílula "Aberta".

### Gráficos (recharts via `components/ui/chart`)

- **Evolução (linhas)**: `ChartContainer` `h-[320px] rounded-xl bg-[var(--chart-surface)]`, `CartesianGrid` só horizontal `--chart-grid`, eixos sem linha, `fontSize 10` em `--content-subtle`, eixo Y abreviado (`4k`), linhas `strokeWidth 2` (receita `3`), `type="linear"`, `isAnimationActive={false}`. Legenda manual acima: bolinha `9px` + rótulo `text-[11px]`, grid 2→4 colunas.
- **Barras horizontais (categorias)**: grid `[87px_minmax(0,1fr)_76px]`, nome truncado | barra SVG `h-[9px]` com trilho `--chart-rail` | valor `text-[11px]`. Mostra top 5; resto rola.
- **Rosca (distribuição)**: `200px` (180px em telas grandes), `innerRadius 57%`, `outerRadius 89%`, `paddingAngle 3`, sem stroke, centro com "Total líquido" + valor, legenda ao lado com `%`. Agrupa em "Outras" acima de 5 fatias. Com privacidade ligada o gráfico some e deixa o espaço.
- **Resumo abaixo do gráfico**: título `text-sm font-semibold`, texto `text-[13px] leading-[19px]`, divisor `border-t`, grid 2 colunas com rótulo `text-xs text-content-muted` + valor `text-xl font-semibold` (colorido por tom positivo/negativo).

### Estados vazios

`FinanceEmptyState` (`components/finance/empty-state.tsx`) dentro do mesmo card, com o título do card mantido. Nunca esconder o card.

### Loading

`loading.tsx` por rota com `DashboardSkeleton`: mesmo header, mesmas alturas e mesmo grid que a página, blocos `animate-pulse rounded-full/xl bg-surface-elevated`, `role="status" aria-busy`, respeitando `motion-reduce`. **Todo redesign de página deve atualizar seu skeleton para casar com o novo layout.**

---

## 7. Receita para redesenhar outra página

1. Header: `h1` (35px) + subtítulo `text-xs`, ações à direita (`MonthPickerField` se mensal, botões `secondary` `h-10`).
2. Grid 704fr/390fr em `xl`; coluna larga para o conteúdo principal, estreita para listas/resumos.
3. Abrir com um card tipo A com **valor herói** da página (ex.: Lançamentos → saldo do mês; Orçamentos → quanto resta; Metas → total guardado).
4. Cada card: título, valor/gráfico, **ilustração 3D com sombra elíptica**.
5. Listas com `divide-y`, valores `font-semibold`, micro-rótulos `uppercase tracking-wider`.
6. Progresso: barra `rounded-full` sobre trilho `bg-surface`/`--chart-rail`; verde ok, vermelho acima do limite.
7. Dados do usuário: `formatCurrency`/`protect` e `data-user-content`.
8. Vazio: `FinanceEmptyState` no card. Loading: skeleton com a mesma geometria.
9. Mobile: tudo vira uma coluna; conferir em 375px e em ≥ 1601px.
10. Verificar light **e** dark.

---

## 8. Inconsistências a corrigir ao propagar

O dashboard ainda tem valores fixos que não deveriam ser copiados; ao reformular, migre para tokens:

- `#ff3b6b` (rosa de "Carteira" em Investimentos) → `chart-2` / `bg-chart-2`.
- `#1d4f9b` (segmento "Gastos fixos") → `bg-chart-5` / `brand-strong`.
- Gradiente do mini-cartão em `DashboardCardsHeader` e chip `#f3d27a` → token ou componente dedicado.
- Tamanhos `text-[Npx]` e paddings `p-[23px]`/`px-[22px]` variam por card (23 vs 22 vs 20): padronizar em um único padding de card (sugestão `p-[23px]`, `p-5` em telas grandes).
- Dois estilos de título (`text-sm` nos cards de métrica, `text-lg`/`text-xl` nos de gráfico): decidir um por tipo de card e manter.
- Alturas fixas em `xl` (`340px`, `704px`) dependem de grid por linha; em páginas novas prefira alturas por conteúdo e deixe o grid esticar (`grid-rows`, `mt-auto` no rodapé do card).
- Cards sem ilustração (ex.: `DashboardBalances`, `DashboardPortfolio`, hoje sem uso na página) não seguem o novo padrão.
