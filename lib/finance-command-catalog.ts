import type {
  FinanceCommandActionDefinition,
  FinanceCommandActionId,
} from "@/lib/interfaces/finance-command";
import { isValidMonth } from "@/lib/finance-ui";

export const FINANCE_COMMAND_ACTIONS = [
  {
    id: "new-income",
    label: "Nova receita",
    description: "Abrir um lançamento de receita",
    href: "/transactions",
    aliases: ["receita", "entrada", "renda", "lançamento"],
  },
  {
    id: "new-expense",
    label: "Nova despesa",
    description: "Abrir um lançamento de despesa",
    href: "/transactions",
    aliases: ["despesa", "gasto", "compra", "lançamento"],
  },
  {
    id: "new-transfer",
    label: "Nova transferência",
    description: "Mover saldo entre contas",
    href: "/transactions",
    aliases: ["transferência", "transferir", "contas"],
  },
  {
    id: "new-credit-card-purchase",
    label: "Nova compra no cartão",
    description: "Registrar uma compra e suas parcelas",
    href: "/credit-card",
    aliases: ["cartão", "cartão de crédito", "compra no cartão", "fatura"],
  },
  {
    id: "new-account",
    label: "Nova conta",
    description: "Cadastrar conta bancária, carteira ou cartão",
    href: "/dashboard",
    aliases: ["conta", "banco", "cartão", "cadastro"],
  },
  {
    id: "new-category",
    label: "Nova categoria",
    description: "Cadastrar uma categoria de receita ou despesa",
    href: "/dashboard",
    aliases: ["categoria", "classificação", "cadastro"],
  },
  {
    id: "new-goal",
    label: "Nova meta",
    description: "Criar uma meta financeira",
    href: "/goals",
    aliases: ["meta", "objetivo", "planejamento"],
  },
] satisfies FinanceCommandActionDefinition[];

export const TRANSACTION_COMMAND_ACTIONS = [
  "new-income",
  "new-expense",
  "new-transfer",
] as const satisfies readonly FinanceCommandActionId[];

export const DASHBOARD_COMMAND_ACTIONS = [
  "new-account",
  "new-category",
] as const satisfies readonly FinanceCommandActionId[];

export const CREDIT_CARD_COMMAND_ACTIONS = [
  "new-credit-card-purchase",
] as const satisfies readonly FinanceCommandActionId[];

export const GOAL_COMMAND_ACTIONS = [
  "new-goal",
] as const satisfies readonly FinanceCommandActionId[];

const MONTHLY_ROUTES = new Set([
  "/dashboard",
  "/transactions",
  "/credit-card",
  "/recurring",
  "/budgets",
]);

export function normalizeFinanceCommandSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function matchesFinanceCommand(value: string, search: string) {
  return normalizeFinanceCommandSearch(value).includes(
    normalizeFinanceCommandSearch(search),
  );
}

export function buildFinanceCommandHref(
  href: string,
  currentSearch: string,
  action?: FinanceCommandActionId,
  commandId?: string,
) {
  const params = new URLSearchParams();
  const currentMonth = new URLSearchParams(currentSearch).get("month");

  if (MONTHLY_ROUTES.has(href) && isValidMonth(currentMonth)) {
    params.set("month", currentMonth);
  }
  if (action) {
    params.set("command", action);
    if (commandId) params.set("commandId", commandId);
  }

  const query = params.toString();
  return query ? `${href}?${query}` : href;
}
