import type { Tone } from "@/lib/interfaces/design-system";
import type {
  PredictabilityAlert,
  PredictabilityBudgetItemKind,
  PredictabilityDayStatus,
} from "@/lib/interfaces/predictability";

export const dayStatusLabels: Record<PredictabilityDayStatus, string> = {
  free: "Livre",
  partial: "Parcial",
  consumed: "Consumido",
};

export const dayStatusTones: Record<PredictabilityDayStatus, Tone> = {
  free: "success",
  partial: "warning",
  consumed: "danger",
};

export const dayStatusCellClassNames: Record<PredictabilityDayStatus, { cell: string; value: string }> = {
  free: {
    cell: "border-success/30 bg-success/[0.08] hover:bg-success/[0.12]",
    value: "text-success",
  },
  partial: {
    cell: "border-warning/40 bg-warning/[0.12] hover:bg-warning/[0.16]",
    value: "text-warning",
  },
  consumed: {
    cell: "border-danger/45 bg-danger/[0.14] hover:bg-danger/[0.18]",
    value: "text-danger",
  },
};

export const budgetItemLabels: Record<PredictabilityBudgetItemKind, string> = {
  income: "Renda",
  fixed: "Fixo",
  credit_card: "Fatura",
};

export function formatAlertTitle(alert: PredictabilityAlert) {
  if (alert.code === "NO_RECURRING_INCOME") {
    return "Sem renda recorrente";
  }

  return alert.code === "FIXED_EXCEED_INCOME" ? "Fixos maiores que a renda" : "Ciclo estourado";
}

export function formatAlertDetail(alert: PredictabilityAlert, amount: string) {
  if (alert.code === "NO_RECURRING_INCOME") {
    return "Cadastre o salário em Recorrentes: ele define o ciclo e o valor por dia. Até lá o ciclo segue o mês do calendário.";
  }

  if (alert.code === "FIXED_EXCEED_INCOME") {
    return `Aluguel, contas, aportes e fatura passam da renda em ${amount}. Não sobra valor por dia neste ciclo.`;
  }

  return `Os gastos passaram do orçamento do ciclo em ${amount}. Esse valor sai do próximo salário.`;
}
