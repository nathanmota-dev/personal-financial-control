import type {
  AllocationType,
  GoalCategory,
  GoalStatus,
  SummaryTone,
} from "./goals-types";

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  housing: "Apartamento",
  vehicle: "Veículo",
  electronics: "Eletrônicos",
  travel: "Viagem",
  education: "Educação",
  emergency: "Emergência",
  other: "Outro",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  archived: "Arquivada",
};

export const GOAL_STATUS_BADGE_CLASSNAMES: Record<GoalStatus, string> = {
  active: "text-brand",
  paused: "text-warning",
  completed: "text-success",
  archived: "text-content",
};

export const GOAL_PRIORITY_OPTIONS = [
  { value: "0", label: "Alta" },
  { value: "1", label: "Média" },
  { value: "2", label: "Baixa" },
] as const;

export const ALLOCATION_TYPE_LABELS: Record<AllocationType, string> = {
  initial_allocation: "Alocação inicial",
  manual_allocation: "Alocação manual",
  manual_release: "Liberação",
  contribution: "Aporte",
  correction: "Correção",
};

export const GOAL_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--success)", "var(--violet)", "var(--danger)",
] as const;

export const SUMMARY_TONE_CLASSNAMES: Record<SummaryTone, string> = {
  cyan: "border-brand/15 bg-brand/8 text-brand",
  sky: "border-brand/15 bg-brand/8 text-brand",
  teal: "border-success/15 bg-success-soft text-success",
  amber: "border-warning/15 bg-warning/8 text-warning",
  violet: "border-violet/15 bg-violet/8 text-violet",
  rose: "border-danger/15 bg-danger/8 text-danger",
};

export const SELECT_TRIGGER_CLASSNAME =
  "h-10 w-full rounded-xl border-input bg-card text-content-strong focus-visible:border-brand/70 focus-visible:ring-brand/20";

export const SELECT_CONTENT_CLASSNAME =
  "rounded-xl border-border bg-card p-1 text-content-strong shadow-none";

export const SELECT_ITEM_CLASSNAME =
  "min-h-10 rounded-lg px-3 py-2 text-sm text-content-strong focus:bg-surface-elevated focus:text-content-strong data-[state=checked]:bg-surface-elevated/90";

export const ALLOCATION_BREAKDOWN_CHART_CONFIG = {
  amount: { label: "Valor", color: "var(--chart-brand)" },
};

export const MONTHLY_EVOLUTION_CHART_CONFIG = {
  allocated: { label: "Alocado", color: "var(--chart-brand)" },
  released: { label: "Liberado", color: "var(--chart-danger)" },
  cumulative: { label: "Acumulado", color: "var(--chart-3)" },
};

export const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
