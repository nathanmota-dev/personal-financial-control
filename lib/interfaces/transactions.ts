import type { TransactionStatus, TransactionType } from "@/lib/db/schema";
import type { InvestmentReductionSelection } from "@/lib/interfaces/investment-reconciliation";

export type TransactionMutationPayload = {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  transactionDate: string;
  competenceMonth: string;
  description: string;
  notes: string;
  sourceSelections?: InvestmentReductionSelection[];
};

