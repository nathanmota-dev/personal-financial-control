import type {
  accounts,
  recurringTemplates,
  transactions,
  transfers,
} from "@/lib/db/schema";
import type {
  ProjectionCalculationResult,
  ProjectedBalancePeriod,
} from "@/lib/interfaces/projected-balance";

export type ProjectedBalanceAccountRow = typeof accounts.$inferSelect;

export type ProjectedBalanceTransactionRow = typeof transactions.$inferSelect & {
  account: ProjectedBalanceAccountRow | null;
  category: { id: string; name: string; group: string } | null;
};

export type ProjectedBalanceRecurringTemplateRow =
  typeof recurringTemplates.$inferSelect & {
    account: ProjectedBalanceAccountRow | null;
    category: { id: string; name: string; group: string } | null;
  };

export type ProjectedBalanceTransferRow = typeof transfers.$inferSelect & {
  fromAccount: ProjectedBalanceAccountRow | null;
  toAccount: ProjectedBalanceAccountRow | null;
};

export type ProjectedBalanceRequest = {
  period: ProjectedBalancePeriod;
  startDate: string;
  endDate?: string;
  accountIds: string[];
  creditAccountIds: string[];
  minimumReserveCents: number;
  includeCreditCard: boolean;
  includeInvestments: boolean;
  includeTransfers: boolean;
};

export type ProjectedBalanceResult = ProjectionCalculationResult & {
  filters: {
    period: ProjectedBalancePeriod;
    startDate: string;
    endDate: string;
    accountIds: string[];
    creditAccountIds: string[];
    minimumReserveCents: number;
    includeCreditCard: boolean;
    includeInvestments: boolean;
    includeTransfers: boolean;
  };
};
