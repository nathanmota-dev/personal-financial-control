# Plan 2: Frontend

## Objetivo
- Construir a interface do app financeiro em `Next 16` + `shadcn`, consumindo a camada backend local do próprio app.
- Entregar navegação, telas de cadastro, visualização de dados e dashboard com foco em clareza para uso pessoal diário.

## Estrutura de Navegação
- Definir layout principal com navegação lateral ou superior para:
  - `Dashboard`
  - `Lançamentos`
  - `Recorrentes`
  - `Investimentos`
  - `Configurações`
- Criar `app` structure coerente com App Router:
  - página inicial do dashboard
  - rotas separadas por área funcional
  - `loading.tsx`, `error.tsx` e `empty states` onde fizer sentido

## Base Visual
- Ajustar metadados, título e identidade do app.
- Refinar `layout.tsx` e `globals.css` para um visual de dashboard financeiro mais intencional.
- Reaproveitar componentes já disponíveis do `shadcn`.
- Padronizar:
  - espaçamento
  - tipografia
  - cores de status financeiro
  - estados de loading, sucesso e erro

## Estratégia de Consumo de Dados
- Leituras principais via `Server Components`.
- Interações de formulário via `Server Actions`.
- Usar componentes client-side apenas onde houver:
  - filtros interativos
  - dialogs e drawers
  - tabelas com interação
  - gráficos
  - feedback assíncrono
- Evitar camada extra de fetch REST no v1 para CRUD interno.
- Se algum componente client precisar atualização sem reload completo, acionar a Server Action e revalidar a rota correspondente.

## Telas do Dashboard
- Criar visão mensal com:
  - cards de resumo
  - gráfico de evolução mensal
  - gráfico de gastos por categoria
  - lista de maiores gastos do mês
  - resumo de saldos por conta
- Adicionar seletor de competência mensal.
- Exibir claramente a separação entre:
  - gastos fixos
  - gastos variáveis
  - aportes
  - resultado líquido

## Telas de Lançamentos
- Criar listagem principal com filtros por:
  - mês
  - tipo
  - conta
  - categoria
  - status
- Criar formulário para novo lançamento com campos:
  - data
  - competência
  - descrição
  - valor
  - tipo
  - conta
  - categoria
  - status
  - observações
- Permitir edição e exclusão com dialogs de confirmação.
- Separar visualmente lançamentos de receita, despesa, aporte e transferência.

## Telas de Contas e Categorias
- Em `Configurações`, criar seções para gerenciar:
  - contas
  - categorias
- Contas:
  - listagem
  - criação
  - edição
  - arquivamento
  - exibição de saldo atual
- Categorias:
  - listagem por grupo
  - criação
  - edição
  - arquivamento

## Tela de Recorrentes
- Listar recorrências cadastradas com status e próxima competência aplicável.
- Criar formulário para:
  - entrada recorrente
  - gasto fixo recorrente
  - aporte recorrente
- Permitir pausar, retomar, editar e encerrar recorrência.
- Destacar quando uma recorrência já gerou lançamento no mês para evitar dúvida operacional.

## Tela de Investimentos
- Criar tela consolidada da carteira com:
  - saldo atual
  - taxa mensal esperada
  - aporte mensal padrão
  - data de referência
- Exibir cards de projeção para:
  - 1 mês
  - 6 meses
  - 12 meses
- Incluir simulador simples com horizonte customizado em meses.
- Mostrar a fórmula de forma amigável, sem excesso técnico, para o usuário entender o cenário projetado.

## Componentes e UX
- Reutilizar componentes `card`, `table`, `dialog`, `drawer`, `select`, `tabs`, `chart`, `input`, `textarea`, `badge`, `skeleton` e `sonner`.
- Criar componentes específicos de domínio:
  - card de KPI financeiro
  - tabela de lançamentos
  - seletor de competência
  - resumo por categoria
  - cartão de projeção de investimentos
- Formatar moeda e datas em `pt-BR`.
- Garantir feedback visual em:
  - submissão
  - sucesso
  - erro
  - vazio

## Responsividade
- Garantir boa usabilidade em desktop e mobile.
- Em mobile:
  - filtros podem virar drawer
  - formulários longos podem usar steps ou seções
  - tabelas devem ter alternativa com cards/lista quando necessário

## Testes Frontend
- Validar renderização correta do dashboard com e sem dados.
- Validar filtros na listagem de lançamentos.
- Validar envio de formulários com erros e sucesso.
- Validar estados de loading e empty state.
- Validar projeção de investimentos exibindo valores coerentes.
- Validar navegação principal em desktop e mobile.

## Critérios de Conclusão
- Todas as views principais do v1 disponíveis e navegáveis.
- CRUDs acessíveis pela interface.
- Dashboard legível e útil para análise mensal.
- Fluxo de uso diário possível sem depender da planilha.
