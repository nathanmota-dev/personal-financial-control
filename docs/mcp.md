# Servidor MCP do Personal Financial Control

O app disponibiliza um servidor MCP local em `POST /api/mcp`. Ele permite que um
cliente compatível, como o Codex, consulte referências e administre receitas,
despesas e compras de cartão sem acessar diretamente as tabelas do banco.

## Configuração rápida

Gere um token com pelo menos 32 caracteres:

```bash
openssl rand -hex 32
```

Use o mesmo token no `.env` do app e no ambiente do processo que inicia o Codex:

```env
PFC_MCP_TOKEN="cole-o-token-aqui"
```

```bash
export PFC_MCP_TOKEN="cole-o-token-aqui"
npm run dev
```

O arquivo `.codex/config.toml` é uma configuração local e está no `.gitignore`. Ele
não vem no clone do repositório. Crie-o antes de iniciar ou reiniciar o Codex:

```bash
mkdir -p .codex
```

Para um app iniciado por `npm run dev` na porta 3000, coloque este conteúdo no
arquivo `.codex/config.toml`:

```toml
[mcp_servers.personal_financial_control]
url = "http://127.0.0.1:3000/api/mcp"
bearer_token_env_var = "PFC_MCP_TOKEN"
required = false
default_tools_approval_mode = "writes"
```

Se o app estiver no Docker ou tiver sido iniciado pelos scripts locais na porta
3007, troque apenas a URL para:

```toml
url = "http://127.0.0.1:3007/api/mcp"
```

`bearer_token_env_var` contém o **nome** da variável, nunca o token. O valor secreto
fica no `.env` para o backend e deve ser exportado como `PFC_MCP_TOKEN` no terminal
que inicia o Codex. Depois de criar ou alterar a configuração, reinicie o Codex e
verifique:

```bash
codex mcp list
```

Na interface do Codex, o comando `/mcp` mostra o estado da conexão e as ferramentas
disponíveis.

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
      "group": "income"
    }
  ]
}
```

Tipos de conta possíveis: `checking`, `savings`, `cash`, `credit` e `investment`.

Grupos de categoria possíveis: `income`, `fixed_expense`, `variable_expense` e
`investment`.

## Receitas e despesas

### `list_transactions`

Lista receitas e despesas de contas não-cartão.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `competenceMonth` | sim | mês `YYYY-MM` |
| `accountId` | não | UUID de uma conta não-cartão |
| `categoryId` | não | UUID da categoria |
| `type` | não | `income` ou `expense` |
| `status` | não | `pending`, `posted` ou `cancelled` |

```json
{
  "competenceMonth": "2026-09",
  "type": "expense",
  "status": "posted"
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

Lista somente compras ou ajustes que possuem uma parcela no mês de fatura informado.

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

Compras vinculadas a uma fatura paga não podem ser alteradas.

### `delete_credit_card_charge`

Exclui uma compra ou ajuste e suas parcelas após confirmação explícita.

```json
{
  "id": "UUID_DA_COMPRA",
  "confirm": true
}
```

Compras vinculadas a uma fatura paga não podem ser excluídas.

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

O MCP não cria nem altera contas, categorias, transferências, investimentos,
recorrências, faturas ou pagamentos. Também não faz upload, leitura ou classificação
de PDFs. Essas operações continuam fora do servidor MCP.

## Teste HTTP básico

Clientes MCP cuidam da negociação do protocolo automaticamente. Para conferir
manualmente se o endpoint responde, inicialize uma sessão stateless:

```bash
curl --silent --show-error \
  --request POST \
  --url http://127.0.0.1:3007/api/mcp \
  --header "Authorization: Bearer $PFC_MCP_TOKEN" \
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
