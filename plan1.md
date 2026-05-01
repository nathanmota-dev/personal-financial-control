# Plan 1: Backend

## Objetivo
- Estruturar o backend do app financeiro usando `Next 16`, `Drizzle ORM` e `Turso` para manter a aplicação preparada para futura troca de banco sem reescrever a camada de domínio.
- Entregar persistência, regras de negócio, CRUDs e consultas analíticas que alimentam o dashboard e as telas operacionais.

## Setup e Infra
- Instalar dependências de backend:
  - `drizzle-orm`
  - `drizzle-kit`
  - `@libsql/client`
  - `zod`
- Configurar `drizzle.config.ts` apontando para o schema e usando `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
- Padronizar `env` com validação centralizada em `lib/env.ts`.
- Criar cliente do banco em `lib/db/index.ts` usando `@libsql/client` + Drizzle.
- Definir convenção de nomes para tabelas, colunas e enums, mantendo tudo em inglês no banco e em português só na interface.

## Modelagem de Dados
- Criar schema inicial com as entidades:
  - `accounts`
  - `categories`
  - `transactions`
  - `transfers`
  - `recurring_templates`
  - `investment_portfolio`
- Regras mínimas do schema:
  - IDs únicos.
  - Valores monetários em `integer` representando centavos.
  - Competência mensal em formato `YYYY-MM`.
  - Datas de criação e atualização.
  - Chaves estrangeiras entre conta, categoria e transação.
- Definir enums ou campos controlados para:
  - tipo de conta
  - grupo de categoria
  - tipo de transação
  - status da transação
  - status da recorrência

## Migrações e Seed
- Criar migração inicial do banco com Drizzle.
- Definir processo padrão:
  - gerar migrações
  - aplicar migrações
  - reset local se necessário
- Criar seed opcional com categorias padrão para:
  - entradas
  - gastos fixos
  - gastos variáveis
  - investimentos
- Incluir exemplos mínimos de contas iniciais apenas se o seed for executado manualmente.

## Camada de Domínio
- Criar módulos server-side por domínio:
  - `accounts`
  - `categories`
  - `transactions`
  - `transfers`
  - `recurring`
  - `investments`
  - `dashboard`
- Cada módulo deve separar:
  - validação de entrada com `zod`
  - acesso ao banco
  - regras de negócio
  - serialização de saída
- Centralizar helpers financeiros:
  - parse de moeda
  - formatação de competência
  - cálculo de saldo
  - cálculo de projeção com juros compostos

## CRUDs e Regras de Negócio
- `Accounts`
  - criar, listar, editar, arquivar e detalhar saldo atual
- `Categories`
  - criar, listar, editar, arquivar
  - impedir exclusão quando houver uso em lançamentos
- `Transactions`
  - criar, listar com filtros, editar, excluir
  - suportar tipos `income`, `expense`, `investment_contribution`
  - distinguir `fixed` e `variable` pela categoria
- `Transfers`
  - criar transferência entre contas
  - refletir débito e crédito sem contaminar resumo de receitas e despesas
- `Recurring Templates`
  - criar, listar, editar, pausar, encerrar
  - gerar lançamentos mensais sob demanda com proteção contra duplicidade
- `Investment Portfolio`
  - salvar saldo atual, taxa mensal esperada, aporte mensal padrão e data de referência
  - atualizar projeções para horizontes fixos e customizados

## Leitura e Consultas Analíticas
- Criar queries para o dashboard mensal:
  - total de entradas
  - total de gastos fixos
  - total de gastos variáveis
  - total de aportes
  - resultado líquido
  - saldo consolidado por conta
- Criar queries para relatórios:
  - evolução mensal
  - gastos por categoria
  - comparação entre meses
  - saldo por conta
- Criar query de projeção da carteira:
  - saldo atual
  - projeção em `1`, `6` e `12` meses
  - projeção customizada por número de meses

## Interface Backend do Next
- Usar `Server Components` para leituras.
- Usar `Server Actions` para mutações do app interno.
- Evitar `Route Handlers` no v1 para CRUD interno; só considerar depois se surgir integração externa.
- Revalidar páginas e segmentos afetados após mutações:
  - dashboard
  - lançamentos
  - recorrentes
  - investimentos

## Tratamento de Erros e Validação
- Validar toda entrada com `zod` antes de tocar no banco.
- Retornar erros de domínio claros para:
  - categoria inexistente
  - conta inexistente
  - transferência inválida
  - recorrência duplicada para o mesmo mês
  - competência inválida
  - valor monetário inválido
- Definir estratégia consistente para erro esperado vs erro inesperado.

## Testes Backend
- Testar criação e atualização de contas.
- Testar CRUD de categorias com proteção de integridade.
- Testar CRUD de lançamentos com filtros por mês, conta, categoria e status.
- Testar criação de transferência sem impacto em totais operacionais.
- Testar geração de recorrências sem duplicar lançamentos.
- Testar cálculo de saldo consolidado.
- Testar resumo mensal por grupo.
- Testar projeção de investimentos com casos de juros compostos conhecidos.

## Critérios de Conclusão
- Banco configurado em Turso com migração inicial aplicada.
- Todos os domínios principais persistidos com Drizzle.
- CRUDs e queries do dashboard disponíveis para consumo do frontend.
- Regras críticas do financeiro cobertas por testes.
