import type {
  AccountType,
  CategoryGroup,
  RecurringStatus,
  TransactionStatus,
  TransactionType,
} from "@/lib/db/schema";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const moneyInputFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const accountTypeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  cash: "Dinheiro",
  credit: "Cartão",
  investment: "Investimento",
};

export const categoryGroupLabels: Record<CategoryGroup, string> = {
  income: "Receitas",
  fixed_expense: "Gastos fixos",
  variable_expense: "Gastos variáveis",
  investment: "Aportes",
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
  investment_contribution: "Aporte",
};

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  pending: "Pendente",
  posted: "Lançado",
  cancelled: "Cancelado",
};

export const recurringStatusLabels: Record<RecurringStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  ended: "Encerrada",
};

export function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatMonthLabel(month: string) {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

export function formatDateLabel(date: string) {
  return shortDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function formatRateFromBps(bps: number) {
  return `${(bps / 100).toFixed(2).replace(".", ",")}% a.m.`;
}

export function getDefaultMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildRecentMonths(count: number, anchorMonth = getDefaultMonth()) {
  const [year, month] = anchorMonth.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  const values: string[] = [];

  for (let index = 0; index < count; index += 1) {
    values.push(
      `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`
    );
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  return values;
}

export function moneyInputToCents(value: string) {
  const trimmed = value.trim().replace(/^R\$\s*/i, "");
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let normalized = trimmed;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized =
      lastComma > lastDot
        ? trimmed.replace(/\./g, "").replace(",", ".")
        : trimmed.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot >= 0) {
    const decimalDigits = trimmed.length - lastDot - 1;
    normalized = decimalDigits <= 2 ? trimmed : trimmed.replace(/\./g, "");
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error("Informe um valor monetário válido.");
  }

  return Math.round(parsed * 100);
}

export function centsToMoneyInput(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}

export function formatMoneyInput(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    return moneyInputFormatter.format(moneyInputToCents(value) / 100);
  } catch {
    return value;
  }
}

export function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

export function getTransactionTone(type: TransactionType) {
  if (type === "income") {
    return "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20";
  }

  if (type === "investment_contribution") {
    return "bg-sky-500/12 text-sky-700 ring-sky-500/20";
  }

  return "bg-rose-500/12 text-rose-700 ring-rose-500/20";
}

export function getStatusTone(status: TransactionStatus | RecurringStatus) {
  if (status === "posted" || status === "active") {
    return "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20";
  }

  if (status === "pending" || status === "paused") {
    return "bg-amber-500/12 text-amber-700 ring-amber-500/20";
  }

  return "bg-slate-500/12 text-slate-700 ring-slate-500/20";
}

export function isValidMonth(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export function isValidDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value));
}
