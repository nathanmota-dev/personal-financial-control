import type {
  ProjectionEvent,
  ProjectionStatus,
  ProjectionSummaryAlert,
  ProjectedBalancePeriod,
} from "@/lib/interfaces/projected-balance";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

export const EMPTY_FILTER_VALUE = "__all__";

export const periodLabels: Record<ProjectedBalancePeriod, string> = {
  next_income: "Próximo recebimento",
  end_of_month: "Fim do mês",
  next_30_days: "Próximos 30 dias",
  next_60_days: "Próximos 60 dias",
  next_90_days: "Próximos 90 dias",
  custom: "Personalizado",
};

export const statusLabels: Record<ProjectionStatus, string> = {
  safe: "Seguro",
  warning: "Atenção",
  negative: "Negativo",
};

export const eventSourceLabels: Record<ProjectionEvent["source"], string> = {
  transaction: "Lançamento",
  recurring: "Recorrente",
  credit_card: "Cartão",
  investment: "Investimento",
  transfer: "Transferência",
};

export const eventTypeLabels: Record<ProjectionEvent["type"], string> = {
  income: "Receita",
  expense: "Saída",
  investment: "Aporte",
  credit_card: "Cartão",
  transfer: "Transferência",
};

export function formatAlertTitle(alert: ProjectionSummaryAlert) {
  if (alert.code === "CURRENT_BALANCE_NEGATIVE") {
    return "Saldo atual negativo";
  }

  if (alert.code === "PROJECTED_BALANCE_NEGATIVE") {
    return "Saldo negativo no período";
  }

  if (alert.code === "BELOW_MINIMUM_RESERVE") {
    return "Abaixo da reserva mínima";
  }

  return "Sem receita futura";
}

export function formatAlertDetail(alert: ProjectionSummaryAlert) {
  const date = alert.date ? formatDateLabel(alert.date) : null;
  const amount =
    typeof alert.amountCents === "number" ? formatCurrency(alert.amountCents) : null;

  if (alert.code === "CURRENT_BALANCE_NEGATIVE") {
    return `${date ?? "Hoje"} · ${amount ?? "saldo negativo"}`;
  }

  if (alert.code === "PROJECTED_BALANCE_NEGATIVE") {
    return `${date ?? "No período"} · menor saldo ${amount ?? "abaixo de zero"}`;
  }

  if (alert.code === "BELOW_MINIMUM_RESERVE") {
    return `${date ?? "No período"} · saldo ${amount ?? "abaixo da reserva"}`;
  }

  return "A projeção usa o fim do período quando nenhuma nova receita aparece.";
}

export function getStatusTone(status: ProjectionStatus) {
  if (status === "safe") {
    return "bg-emerald-400/12 text-emerald-200 ring-emerald-300/25";
  }

  if (status === "warning") {
    return "bg-amber-300/12 text-amber-200 ring-amber-300/25";
  }

  return "bg-rose-400/12 text-rose-200 ring-rose-300/25";
}
