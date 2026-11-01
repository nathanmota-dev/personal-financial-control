# Plano — Aba "Fixos x Variáveis" em Relatórios

> Status: MVP implementado. Itens opcionais da fase 2 permanecem fora do escopo.

## 1. Objetivo

Criar em `/reports` uma aba dedicada só à divisão entre **gastos fixos** e
**gastos variáveis**. Ela deve responder:

- Quanto do gasto do período é fixo e quanto é variável (R$ e %)?
- Quais gastos formam cada grupo?
- Qual é o total de cada grupo e o total geral?

Ela será a **primeira aba**, já selecionada quando o usuário abre Relatórios.
As abas que já existem não mudam e continuam depois dela:

| Ordem | Aba | Situação |
| --- | --- | --- |
| 1 | **Fixos x Variáveis** | **Nova (padrão)** |
| 2 | Meses do ano | Existente |
| 3 | Categorias | Existente |
| 4 | Origens dos totais | Existente |
| 5 | Despesas por data | Existente (só mensal) |
| 6 | Resumo do mês | Existente (só mensal) |

A nova aba não repete o conteúdo das outras: ela não mostra receitas,
investimentos, a comparação por categoria nem o calendário diário.

## 2. Regras de negócio

### 2.1 O que decide se um gasto é fixo ou variável

O que vale é o **grupo da categoria** (`categories.group`), que já existe no banco:

- `fixed_expense` → **Fixo**
- `variable_expense` → **Variável**
- sem categoria, ou categoria de outro grupo → **Sem classificação**

É a mesma regra de `aggregateDashboardMonth` (`lib/dashboard-aggregation.ts`).
Por isso os totais da aba **precisam bater** com os cards "Gastos fixos" e
"Gastos variáveis" do Dashboard, e com a coluna de despesas de "Meses do ano".

### 2.2 Dados usados

A aba usa `readDashboardRecords` (`lib/server/dashboard-records.ts`), a mesma
base das outras abas:

- lançamentos do tipo `expense` que não estão cancelados (inclui os pendentes);
- **parcelas de cartão de crédito**, pelo mês da fatura (`invoiceMonth`);
- ficam de fora os pagamentos de fatura, que já aparecem como parcelas;
- estornos e créditos negativos entram, somando com o sinal deles.

### 2.3 Porcentagens

- Base: `total = fixos + variáveis + sem classificação`.
- `% fixo = fixos / total`, `% variável = variáveis / total` e
  `% sem classificação = sem classificação / total`.
- Se `total <= 0`, as porcentagens aparecem como "—" e o gráfico mostra o estado vazio.
- Arredondar para 1 casa só na hora de exibir. Os cálculos ficam em centavos.

### 2.4 Período

- **Mensal** (`mode=monthly`): os gastos da competência escolhida.
- **Anual** (`mode=annual`): os gastos de todas as competências do ano, até o
  mês atual, como em `reportYearMonths`.
- Comparação com o período anterior: só a diferença em pontos percentuais da
  % fixa (por exemplo, "+3,2 p.p. vs. mês anterior"). É opcional e fica para a fase 2.

### 2.5 Aviso de recorrência classificada como variável

A categoria padrão das despesas recorrentes é "Outros", que é `variable_expense`
(`recurringDefaultCategoryNames.expense` em `lib/category-defaults.ts`). Assim,
um gasto recorrente, como aluguel ou assinatura, pode ser contado como variável.

A aba vai mostrar um `InlineWarning` quando houver lançamentos com
`recurringTemplateId` em categoria variável:

> "N gastos recorrentes estão em categorias variáveis. Revise as categorias em
> Configurações se eles forem fixos."

Esse aviso só informa. Ele não muda a classificação.

## 3. Interface

Os componentes shadcn do projeto (`Card`, `Table`, `Tabs`, `ChartContainer`,
`StatusDotBadge`, `FinanceEmptyState`, `InlineWarning`) serão reutilizados,
seguindo o visual das abas atuais.

### 3.1 Estrutura

```
[Tab: Fixos x Variáveis]
┌──────────────┬──────────────┬──────────────┐
│ Gastos fixos │ Gastos var.  │ Sem classif. │   ← 3 cards (R$ + %)
│ R$ 3.200,00  │ R$ 1.800,00  │ R$ 0,00      │
│ 64,0%        │ 36,0%        │ 0,0%         │
└──────────────┴──────────────┴──────────────┘
┌──────────────────────────────────────────────┐
│ Distribuição (rosca: fixo x variável x s/c)  │   ← mensal: rosca
│                                              │     anual: barras empilhadas por mês
└──────────────────────────────────────────────┘
[InlineWarning de recorrência, se houver]
┌──────────────────────────────────────────────┐
│ Gastos fixos                     Total R$ X  │
│ Descrição | Categoria | Conta/Cartão | Data | Valor
│ ...                                          │
│ Total                                 R$ X   │   ← TableFooter
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Gastos variáveis                 Total R$ Y  │
│ (mesmas colunas)                             │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Sem classificação (só aparece se houver itens)
└──────────────────────────────────────────────┘
```

### 3.2 Detalhes

- **Cards:** no mesmo estilo de `monthly-summary-metrics` e `dashboard-metric`.
  O valor passa por `useFinancialFormatter`, que respeita o modo privacidade.
- **Gráfico:**
  - mensal: `PieChart` (rosca) com `ChartContainer`, como em
    `dashboard-category-distribution.tsx`;
  - anual: `BarChart` empilhado (fixo e variável) por competência, para mostrar
    como a divisão muda ao longo do ano.
  - Cores pelos tokens `--chart-*` do tema, com legenda e tooltip.
- **Tabelas:**
  - Colunas: Descrição, Categoria, Conta/Cartão, Data, Valor. No modo anual,
    o formato depende da decisão 4 (seção 7): lista com a coluna Competência
    ou agrupamento por categoria.
  - Origem: um badge pequeno ("Lançamento" ou "Parcela de cartão"), reutilizando
    `entry-source.tsx`.
  - Ordem: valor decrescente, depois data e id (critério estável).
  - Subtotal por categoria: **fase 2**. Uma linha agrupadora ou um
    `Collapsible` por categoria dentro de cada tabela.
  - O rodapé (`TableFooter`) mostra o total do grupo.
  - No celular, a tabela vira uma lista de cards, como `entry-mobile.tsx` faz em
    "Origens dos totais", para não criar rolagem horizontal.
  - Textos do usuário (descrição, categoria e conta) levam `data-user-content`.
- **Estado vazio:** `FinanceEmptyState` com a mensagem "Sem despesas no período".
- **Carregamento:** como a aba é a primeira, os dados vêm já no SSR (ver 4.2).
  Ela não deve mostrar spinner na abertura.

## 4. Implementação técnica

### 4.1 Tipos (arquivo dedicado — regra do AGENTS.md)

Novo arquivo: `lib/interfaces/expense-groups.ts`

```ts
export type ExpenseGroupKey = "fixed" | "variable" | "unclassified";

export type ExpenseGroupItem = {
  id: string;
  description: string;
  amountCents: number;
  expenseDate: string;
  competenceMonth: string;
  categoryId: string | null;
  categoryName: string;
  accountName: string;
  source: "transaction" | "installment";
  isRecurring: boolean;
};

export type ExpenseGroupTotals = {
  fixedCents: number;
  variableCents: number;
  unclassifiedCents: number;
  totalCents: number;
  fixedShare: number | null;      // 0..1, null se total <= 0
  variableShare: number | null;
  unclassifiedShare: number | null;
};

export type ExpenseGroupMonth = { month: string } & Pick<
  ExpenseGroupTotals, "fixedCents" | "variableCents" | "unclassifiedCents"
>;

export type ExpenseGroupsReport = {
  totals: ExpenseGroupTotals;
  groups: Record<ExpenseGroupKey, ExpenseGroupItem[]>;
  series: ExpenseGroupMonth[];          // usado no gráfico anual
  recurringInVariableCount: number;
};

// Props dos componentes
export type ExpenseGroupsViewProps = { report: ExpenseGroupsReport; mode: ReportMode };
export type ExpenseGroupTableProps = { title: string; items: ExpenseGroupItem[]; totalCents: number; groupByCategory: boolean };
export type ExpenseGroupCardsProps = { totals: ExpenseGroupTotals };
export type ExpenseGroupChartProps = { totals: ExpenseGroupTotals; series: ExpenseGroupMonth[]; mode: ReportMode };
```

### 4.2 Agregação (função pura e testável)

Novo arquivo: `lib/expense-groups.ts`

- `classifyExpenseGroup(group: CategoryGroup | undefined): ExpenseGroupKey`
- `buildExpenseGroupsReport(records: ReportRecords, months: string[]): ExpenseGroupsReport`
  - parte de `records.expenses`, a mesma lista usada no Dashboard;
  - para calcular `isRecurring`, cruza `expense.id` com `records.activeTransactions`
    pelo `recurringTemplateId`. Parcelas de cartão ficam com `false`;
  - monta `series` por mês para o gráfico anual.

Para o aviso de recorrência, `DashboardExpense` não precisa mudar: o cruzamento
é feito com `activeTransactions`, que já vem em `ReportRecords`.

### 4.3 Servidor

`lib/server/reports.ts`:

- Em `getReportInitial`, adicionar o campo `expenseGroups` usando os `records`
  **que já são lidos**, sem nova consulta. Assim a aba padrão abre já renderizada.
- `ReportInitialResult` (`lib/interfaces/reports.ts`) recebe
  `expenseGroups: ExpenseGroupsReport`.

Alternativa, se o payload inicial pesar demais no modo anual: carregar a aba
sob demanda com a view `expense-groups` em `/api/reports`, como
`daily-expenses`. **Recomendação: SSR**, porque a aba é a padrão e a leitura
dos dados já acontece. Validar com `npm run quality:performance`.

### 4.4 Componentes (um por arquivo, sem helpers dentro do componente pai)

Em `components/finance/reports/`:

| Arquivo | Responsabilidade |
| --- | --- |
| `expense-groups-view.tsx` | Container da aba, monta cards, gráfico, aviso e tabelas |
| `expense-groups-cards.tsx` | Os 3 cards de total e % |
| `expense-groups-chart.tsx` | Rosca (mensal) ou barras empilhadas (anual) |
| `expense-group-table.tsx` | Tabela desktop de um grupo com rodapé de total |
| `expense-group-mobile.tsx` | Lista em cards para o celular |
| `expense-group-categories.tsx` | Resumo anual por categoria no desktop e no celular |
| `expense-groups-warning.tsx` | Aviso de recorrência em categoria variável |

### 4.5 Ligação na aba

`components/finance/reports/tables.tsx`:

- `useState("months")` passa a ser `useState("expense-groups")`.
- Novo `TabsTrigger value="expense-groups"` como **primeiro** item, com o ícone
  `Scale` ou `ChartPie` do `lucide-react` e o rótulo **"Fixos x Variáveis"**.
- Novo `TabsContent value="expense-groups"` renderizando
  `<ExpenseGroupsView report={report.expenseGroups} mode={report.mode} />`.

`app/(finance)/reports/page.tsx` não muda, porque a aba vem do `report` inicial.

### 4.6 Exportação CSV (fase 2, opcional)

Adicionar o botão "Exportar fixos x variáveis" em `export-actions.tsx`, com o
formato de `docs/reports-csv.md`: grupo; competência; descrição; categoria;
conta; valor. Isso fica fora do MVP.

## 5. Testes

### 5.1 Unitários (Vitest)

Novo `tests/expense-groups.test.ts`:

- classificação por grupo: fixo, variável, sem categoria e categoria de outro grupo;
- parcelas de cartão entram no grupo da categoria da compra;
- lançamento cancelado e pagamento de fatura ficam de fora (pelo `readDashboardRecords`);
- estorno negativo reduz o total do grupo;
- porcentagens com total zero ou negativo retornam `null`;
- os totais batem com `aggregateDashboardMonth` nos mesmos dados (teste de consistência);
- `isRecurring` e `recurringInVariableCount`;
- modo anual: `series` com um item por mês, na ordem certa.

Atualizar `tests/reports.test.ts` e `tests/report-loading.test.ts` para cobrir
o campo `expenseGroups` em `getReportInitial`.

### 5.2 Frontend

Novo `tests/frontend/components/finance/expense-groups-view.cases.tsx`:
cards, tabelas, rodapé, estado vazio, aviso e modo privacidade (valores ocultos).

### 5.3 E2E (Playwright) — `tests/e2e/reports.spec.ts`

Ajustes que serão necessários:

- Hoje os testes esperam o heading "Meses do ano" logo ao abrir
  (linhas ~32, 56, 78 e 143). Eles vão passar a clicar antes na aba "Meses do
  ano" ou a verificar a nova aba padrão.
- O teste de navegação por teclado (`End` → "Resumo do mês") continua valendo,
  porque a última aba não muda. Adicionar `Home` → "Fixos x Variáveis".
- O loop da linha ~91 recebe "Fixos x Variáveis".
- Novo cenário: criar um gasto fixo e um variável, mais uma compra no cartão,
  abrir `/reports` e conferir a aba padrão, os totais, as % e as linhas de cada tabela.
- Viewport mobile de 390px sem rolagem horizontal, com screenshot em
  `reports/expense-groups-mobile.png`.

### 5.4 Gate

Seguir o `quality-gate-safe-delivery`: `npm run build`, `npm run lint`,
`npm run test`, `npm run quality:check` e `npm run quality:performance`,
mantendo o `no-regression` e os baselines. Atenção ao limite de tamanho de
código e duplicação: os componentes ficam pequenos, um por arquivo.

## 6. Fases

**MVP**

1. Tipos em `lib/interfaces/expense-groups.ts`.
2. Função pura `buildExpenseGroupsReport` com os testes unitários.
3. Campo `expenseGroups` em `getReportInitial`.
4. Componentes da aba (cards, gráfico, tabelas, mobile, aviso).
5. Aba nova como primeira e padrão em `tables.tsx`.
6. Ajuste e criação dos testes E2E.
7. Quality gate completo.

**Fase 2 (opcional)**

- Subtotal por categoria dentro de cada tabela.
- Comparação em p.p. com o período anterior.
- Exportação CSV do detalhamento.
- Link nos cards do Dashboard ("64% fixo") apontando para a aba.
- Links nas linhas para `/transactions?month=...` ou `/credit-card`.

## 7. Decisões adotadas no MVP

1. **Rótulo da aba:** "Fixos x Variáveis", como primeira aba e padrão.
2. **Sem classificação:** terceiro card sempre; tabela apenas quando houver itens.
3. **Carregamento:** SSR, reutilizando a leitura de registros do relatório inicial.
4. **Modo anual:** detalhes agrupados por categoria, com ocorrências, total e
   percentual do grupo. Mensal mantém a lista de itens.
5. **Fase 2:** nenhum item opcional incluído nesta implementação.
6. **Créditos líquidos:** valores e percentuais mantêm o sinal. Se um grupo
   mensal ficar negativo, a rosca é substituída por uma explicação, pois áreas
   negativas não representam essa distribuição. O gráfico anual usa barras
   empilhadas com valores positivos e negativos separados.
