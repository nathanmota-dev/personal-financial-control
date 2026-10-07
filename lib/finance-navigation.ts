import type { FinancePageDestination } from "@/lib/interfaces/finance-command";
import type { SidebarNavigationItem } from "@/lib/interfaces/sidebar-navigation";
import {
  Calculator,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  Landmark,
  LayoutDashboard,
  ListPlus,
  Repeat2,
  Settings,
  Target,
} from "lucide-react";

export const FINANCE_NAVIGATION: SidebarNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    aliases: ["início", "resumo", "visão mensal"],
  },
  {
    href: "/transactions",
    label: "Lançamentos",
    icon: ListPlus,
    aliases: ["lançamento", "transação", "receita", "despesa", "entrada", "saída"],
  },
  {
    href: "/credit-card",
    label: "Cartão",
    icon: CreditCard,
    aliases: ["cartão de crédito", "fatura", "compras"],
  },
  {
    href: "/budgets",
    label: "Orçamentos",
    icon: Target,
    aliases: ["orçamento", "limites"],
  },
  {
    href: "/recurring",
    label: "Recorrentes",
    icon: Repeat2,
    aliases: ["recorrência", "recorrências", "contas fixas"],
  },
  {
    href: "/projected-balance",
    label: "Saldo Projetado",
    icon: ChartNoAxesCombined,
    aliases: ["projeção", "fluxo", "saldo futuro"],
  },
  {
    href: "/investments",
    label: "Investimentos",
    icon: Landmark,
    aliases: ["investimento", "patrimônio"],
    children: [
      { href: "/investments", label: "Visão geral", aliases: ["investimentos geral"] },
      {
        href: "/investments/portfolio",
        label: "Carteira de longo prazo",
        aliases: ["carteira", "ativos", "investimentos carteira"],
      },
      {
        href: "/investments/emergency-reserve",
        label: "Reserva de emergência",
        aliases: ["reserva", "emergência", "reserva financeira"],
      },
    ],
  },
  {
    href: "/reports",
    label: "Relatórios",
    icon: ChartNoAxesCombined,
    aliases: ["relatório", "análises", "exportar"],
  },
  {
    href: "/goals",
    label: "Metas",
    icon: Target,
    aliases: ["meta", "objetivos", "objetivo"],
  },
  {
    href: "/calculators",
    label: "Calculadoras",
    icon: Calculator,
    aliases: ["calculadora", "juros", "simulador"],
    children: [
      {
        href: "/calculators/compound-interest",
        label: "Juros compostos",
        aliases: ["juros compostos", "calculadora de juros compostos"],
      },
    ],
  },
];

export const FINANCE_UTILITY_NAVIGATION: SidebarNavigationItem[] = [
  {
    href: "/settings",
    label: "Configurações",
    icon: Settings,
    aliases: ["configuração", "contas", "categorias", "preferências"],
  },
  {
    href: "/help",
    label: "Ajuda",
    icon: CircleHelp,
    aliases: ["suporte", "como usar"],
  },
];

export function getFinancePageDestinations(): FinancePageDestination[] {
  return [...FINANCE_NAVIGATION, ...FINANCE_UTILITY_NAVIGATION].flatMap((item) => [
    { href: item.href, label: item.label, aliases: item.aliases ?? [], icon: item.icon },
    ...(item.children ?? []).map((child) => ({
      href: child.href,
      label: child.label,
      aliases: child.aliases ?? [],
      icon: item.icon,
    })),
  ]);
}
