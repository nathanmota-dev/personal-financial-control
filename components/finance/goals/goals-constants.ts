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
  active: "text-cyan-200",
  paused: "text-amber-200",
  completed: "text-teal-200",
  archived: "text-slate-300",
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
  "#38bdf8",
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#a78bfa",
  "#22c55e",
  "#fb7185",
  "#eab308",
] as const;

export const SUMMARY_TONE_CLASSNAMES: Record<SummaryTone, string> = {
  cyan: "border-cyan-400/15 bg-cyan-400/8 text-cyan-200",
  sky: "border-sky-400/15 bg-sky-400/8 text-sky-200",
  teal: "border-teal-400/15 bg-teal-400/8 text-teal-200",
  amber: "border-amber-400/15 bg-amber-400/8 text-amber-200",
  violet: "border-violet-400/15 bg-violet-400/8 text-violet-200",
  rose: "border-rose-400/15 bg-rose-400/8 text-rose-200",
};

export const SELECT_TRIGGER_CLASSNAME =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/70 text-slate-100 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20";

export const SELECT_CONTENT_CLASSNAME =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";

export const SELECT_ITEM_CLASSNAME =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90";

export const ALLOCATION_BREAKDOWN_CHART_CONFIG = {
  amount: { label: "Valor", color: "#38bdf8" },
};

export const MONTHLY_EVOLUTION_CHART_CONFIG = {
  allocated: { label: "Alocado", color: "#38bdf8" },
  released: { label: "Liberado", color: "#fb7185" },
  cumulative: { label: "Acumulado", color: "#14b8a6" },
};

export const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
