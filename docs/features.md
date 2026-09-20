# Estado atual do Personal Financial Control

> Documentação resumida das rotas e funcionalidades disponíveis no app em setembro de 2026.

## Visão geral

O Personal Financial Control é um app pessoal de controle financeiro que utiliza Next.js, Drizzle, SQLite/Turso, Zod, Tailwind CSS, Shadcn e Recharts.

Atualmente, o app oferece controle de:

- contas financeiras;
- categorias;
- receitas e despesas;
- transferências;
- lançamentos recorrentes;
- cartão de crédito, compras, parcelas e faturas;
- saldo projetado;
- investimentos e carteira patrimonial;
- metas financeiras;
- integração local com MCP para consultar referências e administrar lançamentos e
  compras de cartão.

Os valores monetários persistidos no banco são criptografados. O app também possui um modo de demonstração em memória, que não altera o banco real.

## Rotas do frontend

### `/`

Página inicial responsável por direcionar o usuário para a área financeira do app.

### `/dashboard`

Visão consolidada de uma competência mensal.

Suporta:

- seleção do mês;
- total de receitas;
- despesas fixas, variáveis e sem categoria;
- aportes e resgates de investimentos;
- saldo livre do mês;
- saldos por conta;
- evolução financeira dos últimos meses;
- gastos por categoria;
- maiores despesas do mês;
- alerta e atalho para despesas sem categoria.

### `/transactions`

Área de lançamentos e transferências.

Suporta:

- criação, edição e exclusão de lançamentos;
- receitas, despesas, aportes e resgates de investimentos;
- lançamentos pendentes, efetivados ou cancelados;
- competência e data do lançamento;
- associação com conta e categoria;
- despesas sem categoria;
- observações;
- filtros por mês, conta, categoria, status e tipo;
- criação e listagem de transferências entre contas;
- tratamento de despesas financiadas por resgate de investimento.

Contas do tipo cartão de crédito não aparecem nessa tela, pois possuem um fluxo próprio.

### `/credit-card`

Área de cartão de crédito organizada por mês da fatura.

Suporta:

- cadastro de cartão nas configurações;
- data de fechamento e vencimento;
- registro de compras à vista ou parceladas;
- cálculo das parcelas e das faturas futuras;
- edição e exclusão de compras;
- ajustes de crédito ou débito;
- gastos por categoria;
- compromissos futuros do cartão;
- comparação entre valor da fatura e disponibilidade mensal;
- registro de pagamento da fatura por uma conta financeira;
- situação de fatura aberta ou paga.

### `/recurring`

Área de lançamentos recorrentes.

Suporta:

- recorrências de receita, despesa e aporte;
- conta, categoria, valor e dia do mês;
- mês inicial e mês final opcional;
- criação, edição, pausa, retomada e encerramento;
- geração dos lançamentos de uma competência;
- proteção contra geração duplicada;
- visualização em calendário mensal;
- resumo de gastos recorrentes por categoria.

### `/projected-balance`

Projeção diária do fluxo de caixa.

Suporta:

- períodos predefinidos ou intervalo personalizado;
- filtro por conta;
- reserva mínima configurável na consulta;
- inclusão opcional de cartão, investimentos e transferências;
- eventos futuros de lançamentos e recorrências;
- visão diária em gráfico, tabela e calendário;
- alertas de saldo abaixo da reserva ou saldo negativo;
- detalhe dos eventos de cada dia;
- simulações temporárias sem persistir novos lançamentos.

### `/investments`

Visão consolidada dos investimentos.

Suporta:

- configuração inicial da carteira;
- saldo consolidado informado pelo usuário;
- data de referência do saldo;
- taxa mensal esperada;
- aportes futuros previstos a partir das recorrências;
- registro de aportes e resgates;
- conciliação do saldo da carteira;
- histórico de contribuições;
- projeção de crescimento dos investimentos.

### `/investments/portfolio`

Detalhamento patrimonial da carteira atual.

Suporta:

- cadastro de ativos e posições;
- ticker, instituição, classe e tipo do instrumento;
- ações, renda fixa, fundos, imóveis, cripto, caixa e outros tipos previstos no domínio;
- valor atual e data de referência informados manualmente;
- finalidades ou “caixinhas” para o patrimônio;
- associação de uma posição a uma ou mais finalidades;
- distribuição da carteira por classe;
- valores alocados, livres e ainda não cadastrados;
- arquivamento de ativos e finalidades;
- reconciliação de reduções e resgates.

Neste momento, o app não busca cotações de mercado automaticamente e não registra compras individuais com quantidade e preço unitário.

### `/goals`

Área de metas financeiras.

Suporta:

- criação e edição de metas;
- categorias como moradia, veículo, viagem, educação e emergência;
- valor alvo e data alvo opcional;
- aporte mensal planejado;
- prioridade e cor;
- estados ativa, pausada, concluída e arquivada;
- alocação e liberação manual de recursos;
- contribuições vinculadas a lançamentos financeiros;
- progresso, valor restante e evolução mensal;
- comparação entre recursos alocados e reserva livre.

### `/settings`

Configuração das estruturas básicas do app.

Suporta:

- criação, edição e arquivamento de contas;
- contas corrente, poupança, dinheiro, cartão e investimento;
- saldo inicial;
- configuração de fechamento e vencimento para cartões;
- criação, edição, arquivamento e exclusão de categorias;
- categorias de receita, despesa fixa, despesa variável e investimento;
- visualização de itens ativos e arquivados.

## Rotas da API

As rotas HTTP estão em `app/api`. Parte das operações da interface também utiliza Server Actions e, por isso, nem toda funcionalidade possui um endpoint REST correspondente.

### Contas

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/accounts` | Lista contas ativas. |
| `POST` | `/api/accounts` | Cria uma conta. |

### Lançamentos

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/transactions` | Lista lançamentos, com filtro opcional por competência. |
| `POST` | `/api/transactions` | Cria um lançamento. |

### Saldo projetado

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/projected-balance` | Calcula a projeção usando os filtros enviados pela URL. |

### Importação

| Método | Rota | Função |
| --- | --- | --- |
| `POST` | `/api/import/financial-json` | Importa um JSON agrupado em entradas, gastos fixos, gastos variáveis e investimentos. |

A importação cria a conta e as categorias ausentes quando necessário e evita duplicidades por comparação dos dados do lançamento.

### Cartão de crédito

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/credit-card/charges` | Lista compras por cartão e/ou mês da fatura. |
| `POST` | `/api/credit-card/charges` | Cria uma compra ou ajuste. |
| `GET` | `/api/credit-card/charges/:id` | Consulta uma compra. |
| `PATCH` | `/api/credit-card/charges/:id` | Atualiza uma compra. |
| `DELETE` | `/api/credit-card/charges/:id` | Exclui uma compra. |
| `GET` | `/api/credit-card/bills` | Lista faturas. |
| `POST` | `/api/credit-card/bills` | Cria ou atualiza os dados de uma fatura. |
| `POST` | `/api/credit-card/bills/:invoiceMonth/payments` | Registra o pagamento de uma fatura. |

### Metas financeiras

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/goals` | Retorna o painel consolidado de metas. |
| `POST` | `/api/goals` | Cria uma meta. |
| `GET` | `/api/goals/:id` | Retorna os detalhes de uma meta. |
| `PATCH` | `/api/goals/:id` | Atualiza uma meta. |
| `DELETE` | `/api/goals/:id` | Arquiva uma meta. |
| `GET` | `/api/goals/:id/allocations` | Lista as movimentações de alocação da meta. |
| `POST` | `/api/goals/:id/allocations` | Aloca ou libera recursos da meta. |
| `POST` | `/api/goals/:id/contributions` | Registra uma contribuição vinculada a uma conta e categoria. |

### MCP local

O endpoint `POST /api/mcp` disponibiliza um servidor MCP compatível com clientes
como o Codex. Ele aceita somente conexões de loopback e exige a variável
`PFC_MCP_TOKEN` com pelo menos 32 caracteres. O endpoint fica desabilitado quando
essa variável não está configurada corretamente.

As ferramentas disponíveis são:

- `list_finance_references`: lista contas e categorias ativas, sem expor saldos;
- `list_transactions` e `get_transaction`: consultam receitas e despesas de
  contas que não são cartão de crédito;
- `create_transaction`, `update_transaction` e `delete_transaction`: administram
  receitas e despesas, com criação idempotente e confirmação literal
  `confirm: true` para exclusões;
- `list_credit_card_charges` e `get_credit_card_charge`: consultam compras e
  ajustes que possuem parcela na fatura selecionada;
- `create_credit_card_charge`, `update_credit_card_charge` e
  `delete_credit_card_charge`: administram compras, ajustes e parcelas, com
  criação idempotente e confirmação literal para exclusões.

Os comandos usam datas `YYYY-MM-DD`, competências e meses de fatura `YYYY-MM`,
valores inteiros em centavos e UUIDs para contas e categorias. Criações exigem uma
chave de idempotência estável; em importações, cada linha deve ser enviada em uma
chamada separada. O MCP não processa PDFs e não expõe operações para contas,
categorias, transferências, investimentos, recorrências, faturas ou pagamentos.

A configuração, os contratos completos e o fluxo recomendado de importação estão
em [`docs/mcp.md`](mcp.md).

## Operações disponíveis por Server Actions

Além das APIs, `app/actions/finance.ts` atende as mutações utilizadas diretamente pelas telas.

As ações cobrem:

- contas e categorias;
- lançamentos e transferências;
- compras de cartão;
- recorrências e geração mensal;
- configuração e conciliação de investimentos;
- aportes e resgates;
- ativos da carteira;
- finalidades patrimoniais e suas alocações.

## Modelo financeiro suportado

### Contas

- conta corrente;
- poupança;
- dinheiro;
- cartão de crédito;
- investimento.

### Categorias

- receita;
- despesa fixa;
- despesa variável;
- investimento.

### Lançamentos

- receita;
- despesa;
- aporte de investimento;
- resgate de investimento;
- pendente, efetivado ou cancelado.

### Investimentos

- carteira consolidada;
- posições individuais com valor manual;
- classes de ativo;
- tipos de instrumento;
- finalidades patrimoniais;
- alocações;
- aportes, resgates e reconciliações;
- projeção por taxa mensal esperada.

## Armazenamento e execução

- O banco utiliza o formato SQLite por meio do Drizzle.
- Em uso normal, a aplicação pode acessar um banco remoto no Turso por URL e token.
- O Docker também permite executar o app com um arquivo SQLite persistido em volume local.
- Os valores monetários são armazenados criptografados com uma chave definida no ambiente.
- O modo demo usa dados temporários em memória.

## Limites atuais relevantes

- Não há autenticação ou separação de dados por usuário; o app foi estruturado para uso pessoal.
- Não há orçamento mensal por categoria.
- Não há importação visual de OFX ou CSV nem conciliação bancária automática.
- Não há cotação automática de ações ou FIIs.
- A carteira atual registra o valor total da posição, não cada compra e venda do ativo.
- Não há cálculo fiscal, imposto de renda ou processamento completo de eventos corporativos.
- Não há integração automática com corretoras ou Open Finance em produção.
- Não há módulo específico para empréstimos e financiamentos.

O plano para evoluir especificamente a carteira de investimentos está documentado em `PLANO_MODULO_INVESTIMENTOS.md`, na raiz do projeto.
