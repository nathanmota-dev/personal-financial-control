# Features para um app financeiro mais completo

> Análise feita em 28/06/2026 com base nas rotas, componentes, schema e serviços implementados neste repositório.

## Resumo executivo

O app já tem uma base forte para controle financeiro pessoal manual. Ele cobre contas, categorias, lançamentos, transferências, recorrências, cartão de crédito com parcelas, carteira consolidada de investimentos, dashboard mensal e saldo projetado.

Para parecer um app financeiro completo, as maiores lacunas não estão no CRUD básico. Elas estão em orçamento planejado versus realizado, metas financeiras, conciliação/importação bancária, ciclo completo de cartão, relatórios mais profundos, backup/exportação e segurança operacional.

Minha recomendação é priorizar primeiro recursos que melhoram decisão mensal e confiabilidade dos dados:

1. Orçamentos mensais por categoria.
2. Metas financeiras.
3. Pagamento e fechamento de fatura de cartão.
4. Importação/conciliação de extratos.
5. Relatórios e exportação.

## O que já existe hoje

### Rotas de interface

| Rota | Estado atual |
| --- | --- |
| `/dashboard` | Resumo mensal com receitas, gastos fixos, gastos variáveis, aportes, saldo livre, evolução, categorias, maiores gastos, saldos por conta e carteira consolidada. |
| `/transactions` | Lançamentos mensais com filtros por mês, conta, categoria, status e tipo; criação, edição e exclusão de lançamentos; criação/listagem de transferências. |
| `/credit-card` | Visão de fatura mensal, compras no cartão, parcelas futuras, gastos por categoria e comparação da fatura com o disponível do mês. |
| `/recurring` | Cadastro e gestão de receitas, despesas e aportes recorrentes, com pausa, retomada e encerramento. |
| `/projected-balance` | Projeção diária de caixa com filtros, reserva mínima, cartão, investimentos e transferências. |
| `/investments` | Carteira consolidada, aportes, histórico de contribuição, taxa esperada e simulação de crescimento. |
| `/settings` | Gestão de contas e categorias, incluindo arquivamento e dados de cartão. |

### APIs e ações

| Área | Estado atual |
| --- | --- |
| Server Actions | Mutations centrais em `app/actions/finance.ts`. |
| Importação | `POST /api/import/financial-json` importa JSON mensal agrupado. |
| Projeção | `GET /api/projected-balance` expõe cálculo de saldo projetado. |
| Domínio | Serviços em `lib/server/*` para contas, categorias, dashboard, lançamentos, transferências, recorrências, cartão, investimentos e saldo projetado. |

### Modelo financeiro já coberto

- Contas dos tipos corrente, poupança, dinheiro, cartão e investimento.
- Categorias por grupos de receita, gasto fixo, gasto variável e investimento.
- Lançamentos com status pendente, efetivado e cancelado.
- Transferências entre contas.
- Recorrências com status ativa, pausada e encerrada.
- Compras de cartão parceladas.
- Faturas mensais calculadas por fechamento do cartão.
- Investimentos consolidados com aporte mensal previsto, taxa mensal esperada e projeções.
- Saldo projetado diário com alertas e reserva mínima.

## Lacunas principais

### 1. Orçamento mensal por categoria

Hoje o app mostra realizado por categoria, mas não há uma meta de gasto planejada. Isso é uma das diferenças mais importantes entre controle financeiro e planejamento financeiro.

Features interessantes:

- Definir orçamento mensal por categoria.
- Separar orçamento fixo, variável e investimento.
- Comparar planejado, realizado, disponível e percentual consumido.
- Copiar orçamento do mês anterior.
- Permitir ajuste pontual por competência.
- Permitir rollover de saldo não usado em categorias específicas.
- Alertar categorias acima de 80%, 100% e acima do orçamento.

Impacto esperado: alto. Essa deveria ser uma das próximas features.

### 2. Metas financeiras

O app tem investimentos e projeção, mas não tem objetivos explícitos. Metas ajudam a transformar saldo e aporte em decisões concretas.

Features interessantes:

- Reserva de emergência.
- Meta de compra ou viagem.
- Meta de investimento por valor e prazo.
- Meta de quitar dívida.
- Progresso por valor atual, valor alvo e data alvo.
- Simulação de aporte necessário para atingir a meta.
- Associação opcional com conta, categoria ou carteira de investimentos.

Impacto esperado: alto, principalmente junto com a tela de investimentos.

### 3. Ciclo completo do cartão de crédito

A área de cartão está bem encaminhada, mas ainda parece focada em compras e parcelas. Para ficar completa, precisa modelar a vida da fatura.

Features interessantes:

- Suporte a mais de um cartão ativo.
- Fatura aberta, fechada, paga, vencida e parcialmente paga.
- Registro de pagamento de fatura como saída de conta bancária.
- Limite total, limite disponível e limite comprometido por parcelas futuras.
- Melhor dia de compra com base no fechamento.
- Despesa recorrente no cartão.
- Estorno, cancelamento e ajuste de parcela.
- Juros, multa ou encargos manuais.

Impacto esperado: alto. Existe uma limitação explícita hoje: a tela trabalha com apenas um cartão ativo.

### 4. Importação e conciliação

Existe uma rota de importação por JSON agrupado, mas um app financeiro completo normalmente precisa importar extrato e conciliar com lançamentos manuais.

Features interessantes:

- Importar CSV, OFX e JSON pela interface.
- Criar tela de pré-visualização antes de persistir.
- Detectar duplicidades por hash, data, valor, descrição e origem.
- Guardar origem externa e identificador externo do lançamento.
- Marcar lançamento como manual, importado ou conciliado.
- Sugerir categoria por descrição, estabelecimento ou regra.
- Permitir conciliar lançamento importado com lançamento já criado manualmente.
- Regras automáticas do tipo: se descrição contém "Uber", categoria "Transporte".
- Evoluir integração Open Finance usando o documento `docs/ANALISE_OPEN_FINANCE.md`.

Impacto esperado: alto para confiabilidade, médio para uso pessoal se o lançamento manual já for suficiente.

### 5. Relatórios avançados

O dashboard mensal é útil, mas ainda falta uma camada de análise histórica mais profunda.

Features interessantes:

- Relatório anual.
- Comparativo entre períodos customizados.
- Evolução de patrimônio líquido.
- Taxa de poupança mensal.
- Média móvel de despesas.
- Ranking de categorias e estabelecimentos.
- Relatório de gastos fixos versus variáveis.
- Relatório de recorrências futuras.
- Fluxo de caixa por semana.
- Exportação de relatórios em CSV ou PDF.

Impacto esperado: médio-alto. Faz sentido depois de orçamento e conciliação.

### 6. Busca, filtros e produtividade

A tela de lançamentos já tem filtros importantes, mas pode ganhar recursos de produtividade para bases maiores.

Features interessantes:

- Busca textual global por descrição, nota, categoria e conta.
- Filtro por faixa de valor.
- Filtro por período livre, não apenas competência mensal.
- Edição em massa de categoria, status ou conta.
- Duplicar lançamento.
- Dividir lançamento em múltiplas categorias.
- Anexar comprovante ou nota fiscal.
- Tags livres além da categoria principal.
- Campo de favorecido/estabelecimento.

Impacto esperado: médio, mas aumenta bastante a usabilidade quando o volume de dados crescer.

### 7. Contas a pagar e receber

Recorrências resolvem parte do problema, mas não representam todos os compromissos futuros.

Features interessantes:

- Agenda de contas a pagar.
- Agenda de contas a receber.
- Vencimento, competência e data de pagamento separados.
- Status aberto, pago, atrasado, cancelado.
- Alertas de vencimento.
- Pagamento parcial.
- Previsão de décimo terceiro, bônus, impostos e despesas anuais.

Impacto esperado: médio-alto. Complementa bem o saldo projetado.

### 8. Dívidas, empréstimos e financiamentos

O app controla despesas, mas não parece ter módulo próprio para dívida.

Features interessantes:

- Cadastro de dívida com saldo devedor.
- Taxa de juros, parcela, prazo e credor.
- Tabela Price ou SAC.
- Simulação de amortização.
- Estratégia bola de neve ou avalanche.
- Histórico de pagamentos.
- Impacto da dívida no patrimônio líquido.

Impacto esperado: médio. É essencial se o usuário tiver financiamentos ou empréstimos.

### 9. Patrimônio e investimentos por ativo

Hoje a carteira de investimentos é consolidada. Isso é simples e bom para o MVP, mas limitado para análise patrimonial.

Features interessantes:

- Ativos individuais: renda fixa, ações, FIIs, ETFs, cripto, previdência e outros.
- Quantidade, preço médio, valor atual e rentabilidade.
- Alocação por classe de ativo.
- Meta de alocação e rebalanceamento.
- Aportes por ativo.
- Rentabilidade mensal e acumulada.
- Separar contribuição, valorização e rendimento.

Impacto esperado: médio. Deve vir depois das bases de orçamento e conciliação, a menos que o foco principal vire investimentos.

### 10. Backup, exportação e portabilidade

Como o app usa dados sensíveis e pessoais, portabilidade é parte importante de um produto confiável.

Features interessantes:

- Exportar backup completo em JSON.
- Restaurar backup completo.
- Exportar lançamentos em CSV.
- Exportar contas, categorias e recorrências.
- Backup automático local.
- Backup criptografado.
- Tela de diagnóstico do banco local.

Impacto esperado: alto para segurança operacional, especialmente se o app for usado como fonte principal de verdade.

### 11. Segurança, privacidade e acesso

Se o app for estritamente local, isso pode ser simples. Se for hospedado, vira obrigatório.

Features interessantes:

- Autenticação.
- Bloqueio por senha local.
- Sessão com expiração.
- Proteção das APIs de importação.
- Auditoria de mudanças sensíveis.
- Mascarar valores em modo privacidade.
- Criptografia de backups.
- Separação de dados por usuário, caso vire multiusuário.

Impacto esperado: depende do modo de uso. Para app local pessoal é médio; para app publicado é crítico.

### 12. Notificações e alertas

O saldo projetado já gera alertas na tela, mas não há uma camada geral de notificações.

Features interessantes:

- Alerta de saldo abaixo da reserva mínima.
- Alerta de fatura perto do vencimento.
- Alerta de orçamento estourado.
- Alerta de recorrência não gerada.
- Alerta de lançamento pendente antigo.
- Resumo semanal ou mensal.

Impacto esperado: médio. Bom depois que orçamento e contas a pagar estiverem implementados.

### 13. Automação e regras

Regras reduzem trabalho manual e aumentam consistência.

Features interessantes:

- Regras de categorização por texto.
- Regras para definir conta padrão.
- Regras para marcar status.
- Regras para criar recorrência a partir de lançamentos repetidos.
- Detecção automática de assinaturas.
- Sugestão de economia em categorias com crescimento anormal.

Impacto esperado: médio. Deve vir depois de importação/conciliação.

### 14. Experiência mobile e PWA

O app usa layout responsivo, mas um financeiro pessoal costuma ser usado no celular na hora da compra.

Features interessantes:

- PWA instalável.
- Atalho rápido para novo lançamento.
- Modo offline para cadastro rápido.
- Sincronização posterior.
- Câmera para comprovante.
- Widget ou tela compacta de saldo e orçamento.

Impacto esperado: médio. Prioridade sobe se o uso principal for no celular.

## Roadmap recomendado

### Fase 1: Planejamento mensal

Objetivo: transformar o app de registro financeiro em ferramenta de decisão mensal.

Entregas:

- Orçamento mensal por categoria.
- Comparativo planejado versus realizado no dashboard.
- Alertas visuais de orçamento.
- Copiar orçamento do mês anterior.
- Primeira versão de metas financeiras.

### Fase 2: Cartão e compromissos

Objetivo: fechar lacunas de fatura e compromissos futuros.

Entregas:

- Múltiplos cartões.
- Status de fatura.
- Pagamento de fatura.
- Limite do cartão.
- Contas a pagar e receber.
- Despesas recorrentes no cartão.

### Fase 3: Conciliação e importação

Objetivo: aumentar confiança nos dados e reduzir digitação manual.

Entregas:

- Importação CSV/OFX/JSON pela UI.
- Pré-visualização e deduplicação.
- Origem externa nos lançamentos.
- Tela de conciliação.
- Regras de categorização.
- Spike ou MVP de Open Finance, se ainda fizer sentido.

### Fase 4: Relatórios e portabilidade

Objetivo: melhorar análise histórica e segurança dos dados.

Entregas:

- Relatórios anuais e por período customizado.
- Patrimônio líquido.
- Taxa de poupança.
- Exportação CSV/PDF.
- Backup e restore em JSON.

### Fase 5: Segurança e maturidade

Objetivo: preparar o app para uso contínuo e, se necessário, hospedagem.

Entregas:

- Autenticação ou bloqueio local.
- Proteção das rotas de API.
- Auditoria básica.
- Backups criptografados.
- PWA/offline, se o uso mobile for prioridade.

## Sugestão de próximas issues

1. Criar modelo `monthly_budgets` com `competenceMonth`, `categoryId`, `plannedAmountCents` e opção de rollover.
2. Adicionar serviço `lib/server/budgets.ts`.
3. Criar rota `/budget` ou adicionar aba de orçamento no dashboard.
4. Exibir planejado versus realizado por categoria no dashboard.
5. Criar modelo `financial_goals` para metas financeiras.
6. Adicionar status de fatura para cartão.
7. Permitir registrar pagamento de fatura saindo de uma conta corrente.
8. Criar importação CSV com tela de revisão antes de salvar.
9. Adicionar `source`, `externalId` e `importHash` em lançamentos.
10. Criar exportação completa em JSON.

## Veredito

Sim, ainda faltam features para chamar de app financeiro completo. Mas a fundação está boa: as partes essenciais de controle manual, cartão, recorrência, investimento e projeção já existem.

O próximo salto de valor deve ser orçamento mensal e metas. Depois disso, cartão completo e conciliação/importação devem deixar o app muito mais robusto para uso diário.
