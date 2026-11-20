import type { ProjectionStatus } from "@/lib/interfaces/projected-balance";

export type SpendingCapacityOverBudget = { categoryName: string; limitCents: number; committedCents: number };

export type SpendingCapacityInvoice = { accountName: string; invoiceMonth: string; totalAmountCents: number; dueDate: string | null; status: string | null };

/** Everything needed to answer "can I still spend this month?" with numbers the app already calculates elsewhere. */
export type SpendingCapacity = {
  today: string;
  month: string;
  /** Projection from today until the next income (or the end of the month when none is known). */
  projection: {
    status: ProjectionStatus;
    endDate: string;
    balanceNowCents: number;
    minimumProjectedBalanceCents: number;
    minimumProjectedBalanceDate: string;
    finalProjectedBalanceCents: number;
    availablePerDayCents: number;
    nextIncomeDate: string | null;
    firstNegativeDate: string | null;
    alerts: string[];
  };
  budget: { limitTotalCents: number; committedCents: number; overBudget: SpendingCapacityOverBudget[] };
  invoices: { totalOpenCents: number; items: SpendingCapacityInvoice[] };
};
