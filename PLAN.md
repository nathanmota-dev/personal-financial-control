# Plano do App de Controle Financeiro Pessoal

## Resumo
- App web single-user em `Next 16` + `shadcn` + `SQLite` local para substituir a planilha por uma visão operacional e analítica.
- Objetivo do v1: cadastrar entradas, gastos fixos, gastos variáveis, aportes em investimento, acompanhar resumo mensal e projetar a carteira consolidada de investimentos.
- Escopo fechado para o v1: sem login, sem importação CSV, sem multiusuário, sem fluxo de caixa futuro e sem controle por ativo individual.

## Requisitos Funcionais
- `Dashboard`
- Exibir cards de `entradas do mês`, `gastos fixos`, `gastos variáveis`, `aportes`, `resultado líquido` e `saldo consolidado`.
- Exibir gráfico de evolução mensal e gráfico de composição de gastos por categoria.
- Permitir filtro por mês de competência.
- `Contas`
- CRUD de contas financeiras com tipos `corrente`, `poupanca`, `dinheiro` e `cartao_sem_fatura`.
- Saldo calculado por `saldo inicial + receitas - despesas - aportes +/- transferências`.
- `Categorias`
- CRUD de categorias com grupo `entrada`, `gasto_fixo`, `gasto_variavel` e `investimento`.
- `Lançamentos`
- CRUD de receitas, despesas, aportes e transferências.
- Campos obrigatórios: `data`, `mes_competencia`, `descricao`, `valor_em_centavos`, `tipo`, `conta`, `categoria`, `status` (`planejado` ou `realizado`) e `observacoes` opcionais.
- Listagem com filtros por `mês`, `tipo`, `conta`, `categoria` e `status`.
- `Recorrência`
- Templates mensais para entradas fixas, gastos fixos e aportes recorrentes.
- Geração sob demanda ao abrir um mês, sem pré-gerar registros infinitos.
- Permitir pausar, editar valor, alterar data-base e encerrar recorrência.
- `Resumo Mensal`
- Consolidar totais por grupo e comparar com meses anteriores.
- Mostrar tabela por categoria para identificar maiores gastos.
- `Investimentos`
- Uma carteira única consolidada com `saldo atual`, `taxa mensal esperada`, `aporte mensal padrão` e `data de referência`.
- Aportes entram no histórico financeiro como lançamentos do tipo `investimento`.
- Projeção com `juros compostos + aporte mensal` para `1`, `6`, `12` meses e horizonte customizado.
- O saldo atual da carteira será a fonte de verdade manual; a projeção parte desse valor, não da soma histórica de aportes.
- Fórmula padrão: aportes no fim de cada mês, taxa fixa mensal informada pelo usuário.

## Arquitetura e Interfaces
- Stack: `Next 16 App Router`, `React 19`, runtime `Node`, `SQLite`, `drizzle-orm` com `better-sqlite3`, validação com `zod`, `shadcn` para UI e `Recharts` para gráficos.
- Leituras em `Server Components`; mutações em `Server Actions`.
- Não criar API REST pública no v1; `Route Handlers` ficam fora do escopo inicial.
- Rotas principais: `Dashboard`, `Lancamentos`, `Recorrentes`, `Investimentos` e `Configuracoes`.
- Entidades principais: `Account`, `Category`, `Transaction`, `Transfer`, `RecurringTemplate` e `InvestmentPortfolio`.
- Valores monetários armazenados em centavos inteiros e mês de competência em `YYYY-MM`.
- `Transfer` afeta apenas saldos de contas e não entra nos totais de receita/despesa.
- Resumo mensal será calculado por query; não haverá tabela de snapshot no v1.
- Cada mutação deve revalidar dashboard, mês afetado e visão de investimentos.
- Componentes client-side ficam restritos a filtros interativos, gráficos, dialogs e formulários avançados; o restante permanece server-first.

## Testes e Cenários
- Criar, editar e excluir lançamento simples atualizando corretamente os totais do mês.
- Gerar recorrências de um mês sem duplicar registros ao reabrir o mesmo período.
- Calcular saldo de conta corretamente com saldo inicial, receitas, despesas, aportes e transferências.
- Classificar corretamente `gasto_fixo` e `gasto_variavel` no dashboard e no resumo mensal.
- Refletir aportes no financeiro sem contar como despesa operacional comum.
- Validar a projeção com cenários conhecidos de juros compostos para `1`, `6` e `12` meses.
- Garantir filtros corretos por `mês`, `conta`, `categoria` e `status`.
- Garantir estados de `loading`, `empty state` e `error` nas páginas principais.
- Garantir uso responsivo em desktop e mobile.

## Assunções e Defaults
- Idioma padrão `pt-BR` e moeda única `BRL`.
- Uso estritamente pessoal e local, portanto sem autenticação no v1.
- Sem importação da planilha nesta fase.
- Sem controle de ativos individuais, resgates detalhados, rentabilidade histórica real ou gestão de fatura de cartão.
- Sem projeção de fluxo de caixa futuro; a projeção cobre apenas a carteira consolidada de investimentos.
