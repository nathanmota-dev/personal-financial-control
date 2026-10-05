import {
Calculator,
ChartNoAxesCombined,
CreditCard,
Landmark,
LayoutDashboard,
ListPlus,
Repeat2,
Settings,
Target,
} from "lucide-react";

import type { HelpGuide,HelpQuestion,HelpStep } from "@/lib/interfaces/help";

export const helpSteps: HelpStep[] = [
  {
    title: "Prepare sua base",
    description:
      "Cadastre suas contas com o saldo inicial e organize as categorias de receitas, despesas e investimentos.",
    href: "/settings",
    linkLabel: "Configurar contas e categorias",
  },
  {
    title: "Registre o dia a dia",
    description:
      "Adicione receitas e despesas, informe a conta e a categoria e acompanhe o que está pendente ou confirmado.",
    href: "/transactions",
    linkLabel: "Ir para Lançamentos",
  },
  {
    title: "Acompanhe e planeje",
    description:
      "Confira o resultado do mês no Dashboard. Depois, organize os compromissos recorrentes e consulte o saldo projetado.",
    href: "/dashboard",
    linkLabel: "Ver meu Dashboard",
  },
];

export const helpGuides: HelpGuide[] = [
  {
    title: "Relatórios",
    description: "Consulte meses e anos por competência, compare categorias e confira a taxa de economia. Pendências estão incluídas; períodos parciais são comparados com o anterior completo. Inspecione as origens dos totais e as fórmulas no relatório.",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Dashboard",
    description:
      "Veja receitas, gastos fixos e variáveis, investimentos líquidos e saldo livre do mês. Os gráficos ajudam a entender a evolução e os gastos por categoria.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lançamentos",
    description:
      "Registre e edite receitas e despesas. Use os filtros para consultar o período, a conta, a categoria e o status. Na aba Transferências, acompanhe movimentações entre contas.",
    href: "/transactions",
    icon: ListPlus,
  },
  {
    title: "Cartão",
    description:
      "Organize compras, parcelas e faturas. Configure o fechamento e o vencimento do cartão para acompanhar os compromissos de cada período.",
    href: "/credit-card",
    icon: CreditCard,
  },
  {
    title: "Recorrentes",
    description:
      "Cadastre receitas e despesas que se repetem, como salário, aluguel e assinaturas. Acompanhe os compromissos do mês e seus vencimentos no calendário.",
    href: "/recurring",
    icon: Repeat2,
  },
  {
    title: "Saldo Projetado",
    description:
      "Consulte a previsão diária do caixa considerando compromissos futuros. Ajuste o período, as contas e a reserva mínima para identificar dias que precisam de atenção.",
    href: "/projected-balance",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Investimentos",
    description:
      "Acompanhe o patrimônio investido, a carteira de longo prazo e a reserva de emergência. Organize os ativos e suas movimentações para consultar a composição e os resultados.",
    href: "/investments",
    icon: Landmark,
  },
  {
    title: "Metas",
    description:
      "Defina objetivos financeiros, valores e prazos. Aloque parte da carteira para cada meta e acompanhe o progresso e o aporte mensal necessário.",
    href: "/goals",
    icon: Target,
  },
  {
    title: "Calculadoras",
    description:
      "Simule juros compostos com um valor inicial e aportes recorrentes. Compare o capital investido com os juros acumulados antes de definir seus planos.",
    href: "/calculators",
    icon: Calculator,
  },
  {
    title: "Configurações",
    description:
      "Crie e edite contas e categorias. Mantenha saldos iniciais e dados dos cartões atualizados e arquive os cadastros que não utiliza mais.",
    href: "/settings",
    icon: Settings,
  },
];

export const helpQuestions: HelpQuestion[] = [
  {
    question: "Como consulto outro mês?",
    answer:
      "Use o seletor de mês nas telas que exibem dados mensais, como Dashboard, Lançamentos, Cartão e Recorrentes. Confira o período selecionado antes de comparar valores ou procurar um lançamento.",
  },
  {
    question: "Qual é a diferença entre pendente e confirmado?",
    answer:
      "Um lançamento pendente representa uma receita ou despesa que ainda não foi efetivada. Confirme quando o recebimento ou pagamento acontecer. O Dashboard reúne os lançamentos do mês de competência, incluindo pendentes, e desconsidera os cancelados.",
  },
  {
    question: "O saldo livre é o mesmo que o saldo da conta?",
    answer:
      "Não. O saldo livre mostra o resultado do mês: receitas menos despesas e investimentos líquidos (aportes menos resgates). O saldo da conta considera também o saldo inicial e as movimentações da conta ao longo do tempo.",
  },
  {
    question: "Por que uma despesa aparece sem categoria?",
    answer:
      "A despesa foi registrada sem uma categoria associada. Ela já reduz o saldo livre. Abra Lançamentos, encontre a despesa e edite sua categoria para organizar os relatórios.",
  },
  {
    question: "O saldo projetado garante quanto terei no futuro?",
    answer:
      "A projeção é uma estimativa baseada nos saldos e compromissos cadastrados e nos filtros escolhidos. Mantenha os registros atualizados e confira quais movimentações estão incluídas na simulação.",
  },
  {
    question: "As calculadoras alteram meus dados financeiros?",
    answer:
      "Não. As simulações ficam somente neste dispositivo e não criam lançamentos, aportes ou metas. Use os resultados como referência para seu planejamento.",
  },
];
