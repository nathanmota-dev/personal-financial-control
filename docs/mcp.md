# Servidor MCP do Personal Financial Control

O app disponibiliza um servidor MCP local em `POST /api/mcp`. Ele permite que um
cliente compatível, como o Codex, consulte referências e administre receitas,
despesas e compras de cartão sem acessar diretamente as tabelas do banco.

## Configuração rápida

Faça login com Google, destrave com seu PIN e abra **Configurações → Segurança → Token MCP**.
Gere um token e copie-o enquanto estiver visível: o servidor armazena apenas seu hash.
Configure o cliente HTTP MCP com:

```http
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
Accept: application/json, text/event-stream
```

Use `http://127.0.0.1:3007/api/mcp` (ou a porta local configurada). Somente hosts
loopback são aceitos. Se o cliente enviar `Origin`, ele deve coincidir com a origem
da URL. Cookies do navegador não autenticam o MCP.

O token é secreto e dá acesso às ferramentas financeiras mesmo com o app travado
ou após sair. Não o inclua em arquivos versionados. Para interromper o acesso,
revogue o token em Segurança; regenerar também invalida imediatamente o anterior.
A autenticação bearer volta a ser utilizada para separar a integração do bloqueio por PIN.

## Convenções dos comandos

- IDs de contas, categorias e registros são UUIDs.
- Datas usam `YYYY-MM-DD`, por exemplo `2026-09-20`.
- Competências e meses de fatura usam `YYYY-MM`, por exemplo `2026-09`.
- Valores monetários são inteiros em centavos. `R$ 123,45` deve ser enviado como
  `12345`.
- Antes de criar registros, execute `list_finance_references` para obter os UUIDs
  válidos.
- Cada linha importada deve ser enviada em uma chamada separada.
- Criações exigem uma chave estável no formato `origem:periodo:linha`, por exemplo
  `itau-conta:2026-09:17`.
- Exclusões exigem confirmação humana e o argumento literal `confirm: true`.
- Lançamentos comuns aceitam somente receitas e despesas em contas que não sejam
  cartão de crédito.
- Compras e ajustes de cartão devem usar exclusivamente os comandos de cartão.

## Formato das respostas

Sucesso:

```json
{
  "ok": true,
  "data": {}
}
```

Erro:

```json
{
  "ok": false,
  "code": "CODIGO_DO_ERRO",
  "message": "Descrição segura do erro",
  "issues": []
}
```

`issues` aparece somente quando há detalhes de validação. As respostas não incluem
stack traces, token de autenticação ou logs dos valores financeiros.

## Referências

### `list_finance_references`

Lista contas e categorias ativas. Não retorna saldos.

Argumentos: nenhum.

Exemplo de retorno:

```json
{
  "accounts": [
    {
      "id": "UUID",
      "name": "Conta corrente",
      "type": "checking",
      "creditClosingDay": null,
      "creditDueDay": 10
    }
  ],
  "categories": [
    {
      "id": "UUID",
      "name": "Salário",
      "group": "income",
      "description": null,
      "isPending": false
    }
  ]
}
```

Tipos de conta possíveis: `checking`, `savings`, `cash`, `credit` e `investment`.

Grupos de categoria possíveis: `income`, `fixed_expense`, `variable_expense` e
`investment`.

A categoria com `isPending: true` ("A classificar") marca registros que ainda não
foram classificados. Ela não deve ser escolhida ao criar ou atualizar registros.

## Receitas e despesas

### `list_transactions`

Lista receitas e despesas de contas não-cartão. Todos os filtros são opcionais e
podem ser combinados.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `competenceMonth` | não | mês `YYYY-MM` |
| `accountId` | não | UUID de uma conta não-cartão |
| `categoryId` | não | UUID da categoria |
| `type` | não | `income` ou `expense` |
| `status` | não | `pending`, `posted` ou `cancelled` |
| `fromDate` | não | data `YYYY-MM-DD`; lançamentos a partir dessa data |
| `toDate` | não | data `YYYY-MM-DD`; lançamentos até essa data |
| `search` | não | trecho da descrição, sem diferenciar maiúsculas nem acentos |
| `uncategorized` | não | `true` para listar só os que não têm categoria ou estão em "A classificar"; tem prioridade sobre `categoryId` |

```json
{
  "competenceMonth": "2026-09",
  "type": "expense",
  "status": "posted"
}
```

```json
{
  "uncategorized": true,
  "fromDate": "2026-09-01",
  "toDate": "2026-09-30"
}
```

### `get_transaction`

Consulta uma receita ou despesa pelo UUID. Movimentações de investimento e
lançamentos legados de cartão ficam fora do escopo.

```json
{
  "id": "UUID_DO_LANCAMENTO"
}
```

### `create_transaction`

Cria uma receita ou despesa de forma idempotente.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `idempotencyKey` | sim | texto de 1 a 255 caracteres |
| `accountId` | sim | UUID de uma conta não-cartão |
| `categoryId` | não | UUID ou `null` |
| `type` | sim | `income` ou `expense` |
| `status` | não | `pending`, `posted` ou `cancelled`; padrão `posted` |
| `amountCents` | sim | inteiro positivo |
| `transactionDate` | sim | data `YYYY-MM-DD` |
| `competenceMonth` | sim | mês `YYYY-MM` |
| `description` | sim | texto não vazio |
| `notes` | não | texto |

```json
{
  "idempotencyKey": "itau-conta:2026-09:17",
  "accountId": "UUID_DA_CONTA",
  "categoryId": "UUID_DA_CATEGORIA",
  "type": "expense",
  "status": "posted",
  "amountCents": 4590,
  "transactionDate": "2026-09-12",
  "competenceMonth": "2026-09",
  "description": "Supermercado",
  "notes": "Importado do extrato"
}
```

A primeira criação retorna `created: true`. Repetir a mesma chave com o mesmo
conteúdo retorna o registro existente e `created: false`. Usar a mesma chave com
conteúdo diferente retorna `IDEMPOTENCY_KEY_CONFLICT`.

### `update_transaction`

Atualiza parcialmente uma receita ou despesa. Informe `id` e pelo menos um campo
alterável de `create_transaction`, exceto `idempotencyKey`. O tipo continua limitado
a `income` ou `expense`.

```json
{
  "id": "UUID_DO_LANCAMENTO",
  "amountCents": 4990,
  "description": "Supermercado corrigido"
}
```

### `delete_transaction`

Exclui uma receita ou despesa após confirmação explícita.

```json
{
  "id": "UUID_DO_LANCAMENTO",
  "confirm": true
}
```

## Compras e ajustes de cartão

### `list_credit_card_charges`

Lista compras e ajustes de cartão. Todos os filtros são opcionais e podem ser
combinados.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `accountId` | não | UUID de uma conta `credit` |
| `invoiceMonth` | não | mês `YYYY-MM`; retorna só compras com parcela nessa fatura, mostrando apenas essas parcelas |
| `fromDate` | não | data `YYYY-MM-DD`; compras a partir dessa data |
| `toDate` | não | data `YYYY-MM-DD`; compras até essa data |
| `search` | não | trecho da descrição, sem diferenciar maiúsculas nem acentos |
| `uncategorized` | não | `true` para listar só as compras em "A classificar" |

```json
{
  "accountId": "UUID_DO_CARTAO",
  "invoiceMonth": "2026-10"
}
```

### `get_credit_card_charge`

Consulta uma compra ou ajuste pelo UUID.

```json
{
  "id": "UUID_DA_COMPRA"
}
```

### `create_credit_card_charge`

Cria uma compra ou ajuste e calcula suas parcelas de forma idempotente.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `idempotencyKey` | sim | texto de 1 a 255 caracteres |
| `accountId` | sim | UUID de uma conta `credit` |
| `categoryId` | sim | categoria `fixed_expense` ou `variable_expense` |
| `description` | sim | texto não vazio |
| `purchaseDate` | sim | data `YYYY-MM-DD` |
| `totalAmountCents` | sim | inteiro diferente de zero |
| `installmentCount` | sim | inteiro entre 1 e 60 |
| `kind` | sim | `purchase` ou `adjustment` |
| `notes` | não | texto ou `null` |
| `firstInvoiceMonth` | não | mês `YYYY-MM`; se omitido, usa a data e o fechamento do cartão |

```json
{
  "idempotencyKey": "itau-cartao:2026-09:23",
  "accountId": "UUID_DO_CARTAO",
  "categoryId": "UUID_DA_CATEGORIA",
  "description": "Notebook",
  "purchaseDate": "2026-09-21",
  "totalAmountCents": 360000,
  "installmentCount": 12,
  "kind": "purchase",
  "notes": "Importado da fatura",
  "firstInvoiceMonth": "2026-10"
}
```

Um `adjustment` deve ter exatamente uma parcela. Assim como nos lançamentos, uma
repetição idêntica retorna `created: false`, enquanto uma chave reaproveitada com
outro conteúdo retorna `IDEMPOTENCY_KEY_CONFLICT`.

### `update_credit_card_charge`

Atualiza parcialmente uma compra ou ajuste. Informe `id` e pelo menos um dos campos
de criação, exceto `idempotencyKey`. Alterações recalculam as parcelas quando
necessário.

```json
{
  "id": "UUID_DA_COMPRA",
  "description": "Notebook e garantia",
  "totalAmountCents": 375000,
  "installmentCount": 12
}
```

Quando só a categoria muda, as parcelas são mantidas como estão (inclusive valores e
meses informados pelo banco), e a alteração é aceita mesmo em compra de fatura paga.
Qualquer outra alteração em compra vinculada a uma fatura paga é recusada. As parcelas
só são recalculadas quando o total, o número de parcelas ou o mês da primeira fatura
mudam.

```json
{
  "id": "UUID_DA_COMPRA",
  "categoryId": "UUID_DA_CATEGORIA"
}
```

### `delete_credit_card_charge`

Exclui uma compra ou ajuste e suas parcelas após confirmação explícita.

```json
{
  "id": "UUID_DA_COMPRA",
  "confirm": true
}
```

Compras vinculadas a uma fatura paga não podem ser excluídas.

## Categorização

### `list_pending_categories`

Lista os registros sincronizados pelo Open Finance que ainda estão sem categoria,
agrupados pela descrição normalizada do banco e pela direção (`income` ou `expense`),
dos maiores totais para os menores. Lançamentos criados manualmente ou pelo MCP não
entram aqui; para eles, use `uncategorized: true` nas listagens.

Argumentos: nenhum.

```json
[
  {
    "normalizedDescription": "IFOOD *RESTAURANTE",
    "direction": "expense",
    "occurrences": 4,
    "totalCents": 18990,
    "suggestion": { "categoryId": "UUID", "reason": "Delivery de comida" }
  }
]
```

`suggestion` só aparece quando a categorização por IA do app sugeriu uma categoria
que ainda é válida.

### `apply_pending_category`

Aplica uma categoria a todos os registros pendentes de um grupo e salva a escolha
como regra: as próximas sincronizações com a mesma descrição já chegam
categorizadas.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `normalizedDescription` | sim | descrição do grupo; uma descrição bruta do banco também é aceita e normalizada |
| `direction` | sim | `income` ou `expense` |
| `categoryId` | sim | UUID de categoria ativa compatível com a direção |

```json
{
  "normalizedDescription": "IFOOD *RESTAURANTE",
  "direction": "expense",
  "categoryId": "UUID_DA_CATEGORIA"
}
```

Retorna quantos registros foram categorizados e quantos grupos continuam pendentes:

```json
{ "applied": 4, "remainingGroups": 12 }
```

Uma categoria arquivada, "A classificar" ou de grupo incompatível retorna
`PLUGGY_CATEGORY_RULE_INVALID`.

### `create_category`

Cria uma categoria quando nenhuma das existentes serve.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `name` | sim | texto de 1 a 80 caracteres |
| `group` | sim | `income`, `fixed_expense`, `variable_expense` ou `investment` |
| `description` | não | texto de até 200 caracteres |

```json
{
  "name": "Pets",
  "group": "variable_expense",
  "description": "Ração e veterinário"
}
```

Repetir o mesmo nome e grupo retorna a categoria existente com `created: false`. Um
nome já usado, mesmo com outras maiúsculas ou acentos, em outro grupo ou por uma
categoria arquivada retorna `CATEGORY_NAME_TAKEN`. O nome "A classificar" é reservado
e retorna `CATEGORY_RESERVED`.

### Fluxo recomendado para categorizar

1. Execute `list_finance_references` para conhecer as categorias.
2. Execute `list_pending_categories` e use `apply_pending_category` em cada grupo,
   aproveitando `suggestion` quando fizer sentido.
3. Para o que sobrar, liste com `uncategorized: true` em `list_transactions` e
   `list_credit_card_charges` e atualize o `categoryId` com `update_transaction` ou
   `update_credit_card_charge`.
4. Crie uma categoria com `create_category` só quando nenhuma existente servir.

## Consultas

As consultas são somente leitura e contam os valores como a tela de relatórios:
lançamentos cancelados e pagamentos de fatura ficam de fora, e compras de cartão
entram no mês da fatura de cada parcela, não no mês da compra.

### `get_spending_summary`

Responde perguntas como "quanto gastei com mercado?": totais por categoria e por mês
num intervalo de competências.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `fromMonth` | sim | mês `YYYY-MM` |
| `toMonth` | não | mês `YYYY-MM`; se omitido, usa `fromMonth`; no máximo 60 meses |
| `type` | não | `income`, `expense`, `investment_contribution` ou `investment_withdrawal` |
| `categoryIds` | não | lista de UUIDs de categoria |
| `uncategorized` | não | `true` para contar só o que está sem categoria ou em "A classificar" |
| `accountId` | não | UUID de qualquer conta, inclusive cartão |
| `search` | não | trecho da descrição, sem diferenciar maiúsculas nem acentos |
| `includeEntries` | não | `true` para devolver também os lançamentos, dos maiores para os menores, até 200 |

```json
{
  "fromMonth": "2026-01",
  "toMonth": "2026-06",
  "type": "expense",
  "categoryIds": ["UUID_DA_CATEGORIA_MERCADO"]
}
```

Exemplo de retorno:

```json
{
  "fromMonth": "2026-01",
  "toMonth": "2026-06",
  "totals": {
    "incomeCents": 0,
    "expenseCents": 184320,
    "fixedExpenseCents": 0,
    "variableExpenseCents": 184320,
    "uncategorizedExpenseCents": 0,
    "investmentContributionCents": 0,
    "investmentWithdrawalCents": 0,
    "entryCount": 37
  },
  "byCategory": [
    {
      "categoryId": "UUID",
      "categoryName": "Mercado",
      "categoryGroup": "variable_expense",
      "type": "expense",
      "amountCents": 184320,
      "entryCount": 37
    }
  ],
  "byMonth": [{ "month": "2026-01", "incomeCents": 0, "expenseCents": 30110 }]
}
```

Despesas sem categoria, em "A classificar" ou em categoria fora dos grupos de despesa
somam em `uncategorizedExpenseCents`, como no painel. Com `includeEntries`, cada
lançamento traz `source` (`transaction` ou `card_installment`), `month`, `date`,
conta e categoria; `entriesTruncated` indica se havia mais de 200.

### `get_budget_overview`

Compara os limites de orçamento com o que foi gasto em cada categoria de despesa num
mês, incluindo categorias com gasto e sem limite.

```json
{
  "competenceMonth": "2026-09"
}
```

Cada linha traz `categoryId`, `categoryName`, `limitCents` (ou `null`),
`postedCents`, `pendingCents`, `committedCents`, `remainingCents`, `percent`,
`state` (`below`, `warning` a partir de 80% ou `reached`) e `expenseCount`.

### `get_credit_card_invoices`

Mostra os totais da fatura de um mês para cada cartão ativo, ou só para o cartão
informado.

```json
{
  "invoiceMonth": "2026-10",
  "accountId": "UUID_DO_CARTAO"
}
```

Cada item traz `totalAmountCents`, `calculatedTotalAmountCents` (soma das parcelas
registradas), `purchaseCount`, `dueDay`, `bill` com `status`, `dueDate`,
`statementTotalCents` e `paidAt` quando há uma fatura registrada, e `categoryTotals`.
As compras em si continuam em `list_credit_card_charges`.

## Fluxo recomendado para importar um documento

1. A LLM lê o PDF e classifica cada linha localmente; o MCP não recebe nem processa
   o arquivo.
2. Execute `list_finance_references` uma vez e associe nomes aos UUIDs retornados.
3. Para cada linha, escolha `create_transaction` ou
   `create_credit_card_charge`.
4. Converta o valor para centavos e gere uma chave determinística, como
   `nome-do-arquivo:2026-09:linha-17`.
5. Faça uma chamada por linha e confira `ok` e `created`.
6. Se houver `IDEMPOTENCY_KEY_CONFLICT`, não gere outra chave automaticamente:
   revise a linha e o registro que já usou aquela chave.

## O que não está exposto

O MCP não cria nem altera contas, transferências, investimentos, recorrências,
faturas ou pagamentos. Categorias podem ser criadas, mas não renomeadas, arquivadas
ou excluídas, e as regras de categorização aprendidas não podem ser listadas nem
removidas pelo MCP. As consultas não informam saldos de contas. Também não faz upload, leitura ou classificação
de PDFs. Essas operações continuam fora do servidor MCP.

## Teste HTTP básico

Clientes MCP cuidam da negociação do protocolo automaticamente. Para conferir
manualmente se o endpoint responde, inicialize uma sessão stateless:

```bash
curl --silent --show-error \
  --request POST \
  --url http://127.0.0.1:3007/api/mcp \
  --header "Cookie: session=$PFC_SESSION_COOKIE" \
  --header "Origin: $APP_URL" \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "1.0" }
    }
  }'
```

Nunca coloque o token diretamente em arquivos versionados, histórico de comandos ou
logs.
