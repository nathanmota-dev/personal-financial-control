import type {
  AccountType,
  CategoryGroup,
  TransactionStatus,
  TransactionType,
} from "@/lib/db/schema";
import type { InvestmentReductionSelection } from "@/lib/interfaces/investment-reconciliation";
import type {
  TransactionFundingLink,
  TransactionFundingSource,
} from "@/lib/interfaces/transaction-funding";
import type { ReactNode } from "react";

export type { TransactionFundingLink, TransactionFundingSource } from "@/lib/interfaces/transaction-funding";

export type TransactionMutationPayload = {
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  transactionDate: string;
  competenceMonth: string;
  description: string;
  notes: string;
  fundingSource?: TransactionFundingSource;
  sourceSelections?: InvestmentReductionSelection[];
};

export type TransactionAccountOption = {
  id: string;
  name: string;
  type: AccountType;
  currentBalanceCents: number;
};

export type TransactionCategoryOption = {
  id: string;
  name: string;
  group: CategoryGroup;
};

export type TransactionRow = {
  id: string;
  accountId: string;
  categoryId: string | null;
  recurringTemplateId: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  transactionDate: string;
  competenceMonth: string;
  description: string;
  notes?: string | null;
  fundingSource: TransactionFundingSource;
  fundingLink: TransactionFundingLink | null;
  isGeneratedByFunding: boolean;
  account: { id: string; name: string } | null;
  category: { id: string; name: string; group: CategoryGroup } | null;
};

export type TransferRow = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  transferDate: string;
  competenceMonth: string;
  description: string;
  fromAccount: { id: string; name: string } | null;
  toAccount: { id: string; name: string } | null;
};

export type TransactionFilters = {
  month: string;
  accountId?: string;
  categoryId?: string;
  uncategorized?: boolean;
  status?: string;
  type?: string;
  section?: string;
};

export type TransactionsViewProps = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  transactions: TransactionRow[];
  transfers: TransferRow[];
  filters: TransactionFilters;
};

export type FilterSelectOption = {
  value: string;
  label: string;
};

export type TransactionFiltersProps = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  filters: TransactionFilters;
};

export type FilterSelectProps = {
  value?: string;
  emptyLabel: string;
  options: FilterSelectOption[];
  onValueChange: (value?: string) => void;
};

export type TransactionDialogProps = {
  accounts: TransactionAccountOption[];
  categories: TransactionCategoryOption[];
  month: string;
  transaction?: TransactionRow;
  trigger?: ReactNode;
  afterCategorization?: string;
};

export type TransactionSummaryCardProps = {
  label: string;
  value: string;
  tone: "cyan" | "blue" | "sky" | "amber";
};

export type TransferDialogProps = {
  accounts: TransactionAccountOption[];
  month: string;
};

export type DeleteTransactionDialogProps = {
  id: string;
};
