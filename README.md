# Personal Financial Control

## Inicializacao local

Para iniciar o app local sem entrar na pasta nem rodar comandos manualmente, use:

```bash
./start-app.sh
```

O script:

- instala dependencias se `node_modules` ainda nao existir
- reaproveita o build atual quando o codigo nao mudou
- roda `npm run build` automaticamente quando detectar mudanca relevante
- aplica as migracoes locais antes de subir o servidor
- inicia o app com `npm start`

Para usar como um app clicavel no Linux, use:

```bash
./open-app.sh
```

Esse launcher sobe o servidor em background na porta `3007` e abre o app em uma janela dedicada do Brave, com perfil separado do navegador pessoal. Quando essa janela e fechada, o launcher encerra o servidor automaticamente.

Opcoes uteis:

```bash
PORT=3007 ./start-app.sh
START_APP_SKIP_SERVER=1 ./start-app.sh
START_APP_SKIP_BROWSER=1 ./open-app.sh
```

`START_APP_SKIP_SERVER=1` serve para validar o fluxo completo sem deixar o processo preso no servidor.
`START_APP_SKIP_BROWSER=1` serve para validar a subida supervisionada sem abrir a janela do app.

## Backend Contract

No v1 atual, o backend não expõe rotas HTTP em `app/api`.
O frontend consome:

- leituras via funções server-side em `lib/server/*`
- mutações via `Server Actions` em [app/actions/finance.ts](/home/nathan/Desktop/git/personal-financial-control/app/actions/finance.ts)

Se no futuro houver necessidade de integração externa, mobile ou API pública, essas mesmas regras podem ser reaproveitadas em `app/api/.../route.ts`.

## Leituras

| Consumo | Origem | Payload de entrada | Retorno resumido |
| --- | --- | --- | --- |
| Dashboard mensal | `getMonthlyDashboard(month)` | `{ month: "YYYY-MM" }` | `{ competenceMonth, totals: { incomeCents, fixedExpenseCents, variableExpenseCents, investmentContributionCents, netResultCents }, accountBalances: [{ id, name, type, currentBalanceCents }], investmentProjection }` |
| Evolução mensal | `getMonthlyEvolution(months)` | `{ months: ["YYYY-MM", "YYYY-MM"] }` | `Array<MonthlyDashboard>` |
| Gastos por categoria | `getCategorySpendingReport(competenceMonth)` | `{ competenceMonth: "YYYY-MM" }` | `[{ categoryId, categoryName, amountCents }]` |
| Comparação entre meses | `compareMonths(leftMonth, rightMonth)` | `{ leftMonth: "YYYY-MM", rightMonth: "YYYY-MM" }` | `{ left: MonthlyDashboard, right: MonthlyDashboard }` |
| Listar contas | `listAccounts(options?)` | `{ includeArchived?: boolean }` | `[{ id, name, type, initialBalanceCents, isArchived, currentBalanceCents, metrics, createdAt, updatedAt }]` |
| Detalhar conta | `getAccountDetails(id)` | `{ id: "uuid" }` | `{ id, name, type, initialBalanceCents, isArchived, currentBalanceCents, metrics: { postedIncomeCents, postedExpenseCents, postedInvestmentContributionCents, outgoingTransferCents, incomingTransferCents }, createdAt, updatedAt }` |
| Listar categorias | `listCategories(options?)` | `{ includeArchived?: boolean }` | `[{ id, name, group, isArchived, createdAt, updatedAt }]` |
| Listar lançamentos | `listTransactions(filters?)` | `{ competenceMonth?: "YYYY-MM", accountId?: "uuid", categoryId?: "uuid", status?: "pending" \| "posted" \| "cancelled" }` | `[{ id, accountId, categoryId, type, status, amountCents, transactionDate, competenceMonth, description, notes, recurringTemplateId, account, category, createdAt, updatedAt }]` |
| Listar transferências | `listTransfers(filters?)` | `{ competenceMonth?: "YYYY-MM", accountId?: "uuid" }` | `[{ id, fromAccountId, toAccountId, amountCents, transferDate, competenceMonth, description, fromAccount, toAccount, createdAt, updatedAt }]` |
| Listar recorrências | `listRecurringTemplates()` | `void` | `[{ id, accountId, categoryId, type, status, amountCents, dayOfMonth, startMonth, endMonth, lastGeneratedMonth, description, account, category, createdAt, updatedAt }]` |
| Carteira consolidada | `getInvestmentPortfolio()` | `void` | `{ id, currentBalanceCents, monthlyContributionCents, expectedMonthlyRateBps, referenceDate, createdAt, updatedAt } \| null` |
| Projeção da carteira | `getInvestmentProjection()` | `void` | `{ id, currentBalanceCents, baseBalanceCents, unincorporatedContributionCents, monthlyContributionCents, expectedMonthlyRateBps, referenceDate, baseReferenceDate, projection: { 1, 6, 12, 24 }, createdAt, updatedAt } \| null` |
| Histórico de aportes | `getInvestmentContributionHistory()` | `void` | `{ totalContributionCents, points: [{ month, monthlyContributionCents, cumulativeContributionCents }] }` |

## Mutações

| Ação do frontend | Server Action | Payload de entrada | Retorno resumido |
| --- | --- | --- | --- |
| Criar conta | `createAccountAction(input)` | `{ name: string, type: "checking" \| "savings" \| "cash" \| "credit" \| "investment", initialBalanceCents: number }` | `{ id, name, type, initialBalanceCents, isArchived, createdAt, updatedAt }` |
| Editar conta | `updateAccountAction(input)` | `{ id: "uuid", name?: string, type?: "checking" \| "savings" \| "cash" \| "credit" \| "investment", initialBalanceCents?: number }` | `{ id, name, type, initialBalanceCents, isArchived, createdAt, updatedAt }` |
| Arquivar conta | `archiveAccountAction(id)` | `{ id: "uuid" }` | `{ id, name, type, initialBalanceCents, isArchived: true, createdAt, updatedAt }` |
| Criar categoria | `createCategoryAction(input)` | `{ name: string, group: "income" \| "fixed_expense" \| "variable_expense" \| "investment" }` | `{ id, name, group, isArchived, createdAt, updatedAt }` |
| Editar categoria | `updateCategoryAction(input)` | `{ id: "uuid", name?: string, group?: "income" \| "fixed_expense" \| "variable_expense" \| "investment" }` | `{ id, name, group, isArchived, createdAt, updatedAt }` |
| Arquivar categoria | `archiveCategoryAction(id)` | `{ id: "uuid" }` | `{ id, name, group, isArchived: true, createdAt, updatedAt }` |
| Excluir categoria | `deleteCategoryAction(id)` | `{ id: "uuid" }` | `void` |
| Criar lançamento | `createTransactionAction(input)` | `{ accountId: "uuid", categoryId: "uuid", type: "income" \| "expense" \| "investment_contribution", status?: "pending" \| "posted" \| "cancelled", amountCents: number, transactionDate: "YYYY-MM-DD", competenceMonth: "YYYY-MM", description: string, notes?: string, recurringTemplateId?: "uuid" }` | `{ id, accountId, categoryId, type, status, amountCents, transactionDate, competenceMonth, description, notes, recurringTemplateId, createdAt, updatedAt }` |
| Editar lançamento | `updateTransactionAction(input)` | `{ id: "uuid", accountId?: "uuid", categoryId?: "uuid", type?: "income" \| "expense" \| "investment_contribution", status?: "pending" \| "posted" \| "cancelled", amountCents?: number, transactionDate?: "YYYY-MM-DD", competenceMonth?: "YYYY-MM", description?: string, notes?: string, recurringTemplateId?: "uuid" }` | `{ id, accountId, categoryId, type, status, amountCents, transactionDate, competenceMonth, description, notes, recurringTemplateId, createdAt, updatedAt }` |
| Excluir lançamento | `deleteTransactionAction(id)` | `{ id: "uuid" }` | `void` |
| Criar transferência | `createTransferAction(input)` | `{ fromAccountId: "uuid", toAccountId: "uuid", amountCents: number, transferDate: "YYYY-MM-DD", competenceMonth: "YYYY-MM", description: string }` | `{ id, fromAccountId, toAccountId, amountCents, transferDate, competenceMonth, description, createdAt, updatedAt }` |
| Criar recorrência | `createRecurringTemplateAction(input)` | `{ accountId: "uuid", categoryId: "uuid", type: "income" \| "expense" \| "investment_contribution", status?: "active" \| "paused" \| "ended", amountCents: number, dayOfMonth: number, startMonth: "YYYY-MM", endMonth?: "YYYY-MM", description: string }` | `{ id, accountId, categoryId, type, status, amountCents, dayOfMonth, startMonth, endMonth, lastGeneratedMonth, description, createdAt, updatedAt }` |
| Editar recorrência | `updateRecurringTemplateAction(input)` | `{ id: "uuid", accountId?: "uuid", categoryId?: "uuid", type?: "income" \| "expense" \| "investment_contribution", status?: "active" \| "paused" \| "ended", amountCents?: number, dayOfMonth?: number, startMonth?: "YYYY-MM", endMonth?: "YYYY-MM", description?: string }` | `{ id, accountId, categoryId, type, status, amountCents, dayOfMonth, startMonth, endMonth, lastGeneratedMonth, description, createdAt, updatedAt }` |
| Pausar recorrência | `pauseRecurringTemplateAction(id)` | `{ id: "uuid" }` | `{ id, status: "paused", ... }` |
| Encerrar recorrência | `endRecurringTemplateAction(id, endMonth)` | `{ id: "uuid", endMonth: "YYYY-MM" }` | `{ id, status: "ended", endMonth, ... }` |
| Gerar lançamentos recorrentes do mês | `generateRecurringTransactionsAction(month)` | `{ month: "YYYY-MM" }` | `Array<Transaction>` |
| Salvar carteira consolidada | `saveInvestmentPortfolioAction(input)` | `{ currentBalanceCents: number, monthlyContributionCents: number, expectedMonthlyRateBps: number, referenceDate: "YYYY-MM-DD" }` | `{ id, currentBalanceCents, monthlyContributionCents, expectedMonthlyRateBps, referenceDate, createdAt, updatedAt }` |
| Registrar aporte da carteira | `createInvestmentContributionAction(input)` | `{ accountId: "uuid", categoryId: "uuid", amountCents: number, transactionDate: "YYYY-MM-DD" }` | `{ id, accountId, categoryId, type: "investment_contribution", status: "posted", amountCents, transactionDate, competenceMonth, createdAt, updatedAt }` |

## Regras de payload

| Campo | Regra |
| --- | --- |
| `id`, `accountId`, `categoryId`, `fromAccountId`, `toAccountId`, `recurringTemplateId` | UUID |
| `amountCents`, `initialBalanceCents`, `currentBalanceCents`, `monthlyContributionCents` | inteiro em centavos |
| `expectedMonthlyRateBps` | taxa mensal em basis points. Ex.: `100` = `1%` ao mês |
| `competenceMonth`, `startMonth`, `endMonth`, `month` | formato `YYYY-MM` |
| `transactionDate`, `transferDate`, `referenceDate` | formato `YYYY-MM-DD` |
| `type` de lançamento | `income`, `expense`, `investment_contribution` |
| `status` de lançamento | `pending`, `posted`, `cancelled` |
| `group` de categoria | `income`, `fixed_expense`, `variable_expense`, `investment` |
| `status` de recorrência | `active`, `paused`, `ended` |

Nas projeções, o primeiro mês usa a taxa efetiva proporcional aos dias restantes desde `referenceDate` e não recebe o aporte mensal previsto. Os aportes previstos começam no fechamento do mês seguinte. Ao salvar novamente a carteira, o saldo informado se torna o novo checkpoint e os aportes realizados pendentes são consolidados nele.

## Observação importante

Se você quiser consumir isso a partir de componentes client-side, o fluxo esperado neste v1 é:

- o formulário client importa a `Server Action`
- envia o payload diretamente para a action
- a action persiste e revalida as páginas afetadas

Ou seja, a “interface de backend” atual para o frontend é essa tabela de funções e payloads, não endpoints REST.
