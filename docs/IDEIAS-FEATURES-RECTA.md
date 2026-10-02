# Ideias de funcionalidades a partir do Recta

Comparação realizada em 01/10/2026 entre o Recta e o Personal Financial Control, com base nas telas, na lógica implementada e nos READMEs dos projetos. Este documento registra ideias para implementação futura; não representa funcionalidades já entregues nem um compromisso de implementação.

## Base atual do Personal Financial Control

O app já possui contas, categorias, lançamentos, transferências, recorrências, cartões, metas, gráficos, projeção de saldo e investimentos. A área de investimentos inclui carteira, cotações, reserva e simulações e deve ser preservada como um diferencial.

## Funcionalidades adicionais e melhorias

| Funcionalidade do Recta | Ideia para o Personal Financial Control |
|---|---|
| Orçamentos mensais por categoria | Definir limites como “até R$ 800 em alimentação” e acompanhar o consumo. O resumo de cartão existente não substitui esse planejamento por categoria. |
| Planejado × realizado | Comparar os limites definidos com receitas e despesas reais do mês. |
| Alertas de orçamento | Avisar quando os gastos estiverem perto do limite ou o ultrapassarem. |
| Relatórios mensais e anuais | Criar uma área dedicada com taxa de economia, médias, comparação entre períodos e tendências por categoria. O dashboard atual já cobre parte dos gráficos. |
| Exportação de relatórios em CSV | Baixar o resumo financeiro e os valores por categoria para analisar em planilha. |
| Retrospectiva do mês | Mostrar o resultado do mês, a maior despesa, a categoria com mais gastos e a comparação com o mês anterior. O Recta também inclui um pequeno quiz. |
| Insights automáticos | Transformar números em mensagens como “seus gastos aumentaram” ou “sua taxa de economia foi de X%”. Podem ser regras calculadas, sem precisar de IA. |
| Mapa de calor de gastos | Mostrar visualmente em quais dias os gastos se concentram. |
| Dashboard personalizável | Permitir escolher quais blocos aparecem e reorganizar sua ordem. |
| Onboarding guiado | Conduzir o primeiro uso com preferências, contas, recorrências e orçamentos. Hoje o app orienta principalmente pelos estados vazios. |
| Login e recuperação de senha | Oferecer contas individuais, login por e-mail ou Google e verificação de e-mail. |
| Finanças compartilhadas | Criar grupos familiares, convidar pessoas e separar o contexto pessoal do compartilhado. |
| Permissões por membro | Diferenciar quem administra, edita ou apenas visualiza as finanças do grupo. |
| Rateio de despesas entre pessoas | Dividir uma despesa entre membros e associar a parte de cada um à sua conta. |
| Central de notificações | Reunir avisos de orçamento e eventos do grupo, com controle de leitura. |
| Menu de comandos com Ctrl+K | Navegar e iniciar ações rapidamente, como criar lançamento, conta ou meta. |
| Ocultar valores financeiros | Borrar valores para usar o app perto de outras pessoas ou compartilhar a tela. |
| Idiomas e moeda de exibição | Adicionar preferências de idioma e formatação monetária. Isso não implica conversão cambial automática. |
| Instalação pelo navegador como PWA | Oferecer instalação no celular e desktop. O launcher Linux existente já atende parte dessa necessidade no computador. |

## Ordem sugerida para uso pessoal

- [ ] 1. Orçamentos mensais por categoria.
- [ ] 2. Comparação entre planejado e realizado.
- [ ] 3. Alertas de orçamento.
- [ ] 4. Relatórios mensais e anuais com exportação CSV.
- [ ] 5. Insights automáticos.
- [ ] 6. Retrospectiva mensal.
- [ ] 7. Personalização do dashboard.
- [ ] 8. Mapa de calor de gastos.
- [ ] 9. Menu de comandos e opção de ocultar valores.
- [ ] 10. Onboarding guiado.

## Evolução para múltiplos usuários

Login, grupos e permissões ganham prioridade se o app passar a ser disponibilizado para outras pessoas. Essa evolução exige também separar os dados e autorizar o acesso a cada contexto.

- [ ] Login, recuperação de senha e verificação de e-mail.
- [ ] Grupos familiares e convites.
- [ ] Separação entre finanças pessoais e compartilhadas.
- [ ] Permissões por membro.
- [ ] Rateio de despesas entre pessoas.
- [ ] Central de notificações.

## Melhorias de alcance

- [ ] Idiomas e moeda de exibição.
- [ ] Instalação como PWA.

## Referências no código do Recta

Caminhos relativos à raiz do workspace `recta`:

- Orçamentos: `recta-selfhosted-frontend/src/pages/Budgets.tsx` e `recta-selfhosted-backend/src/modules/budgets/`.
- Relatórios e CSV: `recta-selfhosted-frontend/src/pages/Reports.tsx`.
- Dashboard e gráficos: `recta-selfhosted-frontend/src/components/widgets/`.
- Preferências do dashboard: `recta-selfhosted-frontend/src/hooks/useDashboardPreferences.ts`.
- Retrospectiva: `recta-selfhosted-frontend/src/components/MonthlyRecap/`.
- Onboarding: `recta-selfhosted-frontend/src/components/OnboardingModal.tsx` e `recta-selfhosted-frontend/src/components/onboarding/steps/`.
- Login: `recta-selfhosted-frontend/src/context/AuthContext.tsx`.
- Grupos e permissões: `recta-selfhosted-backend/src/modules/households/`.
- Rateio: `recta-selfhosted-backend/src/modules/transactions/transaction-splits.service.ts`.
- Notificações: `recta-selfhosted-backend/src/modules/notifications/`.
- Menu de comandos: `recta-selfhosted-frontend/src/components/CommandMenu.tsx`.
