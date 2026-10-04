import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import type { UseTransactionDialogStateContext } from "@/lib/interfaces/stages/use-transaction-dialog-state";
import type { TransactionFundingSource } from "@/lib/interfaces/transaction-funding";
import type {
TransactionMutationPayload,
TransactionRow
} from "@/lib/interfaces/transactions";
import { accountValue,categoryValue } from "@/lib/utils/components/transaction-dialog";
import { useRouter } from "next/navigation";
import { useId,useState,useTransition } from "react";

export function useTransactionDialogState({ transaction, accounts, categories, month }: UseTransactionDialogStateContext) {
const router = useRouter();

const formId = useId();

const [open, setOpen] = useState(false);

const [isPending, startTransition] = useTransition();

const [formError, setFormError] = useState<string | null>(null);

const initialType = transaction?.type ?? "expense";

const [selectedType, setSelectedType] =
    useState<TransactionRow["type"]>(initialType);

const [selectedAccountId, setSelectedAccountId] = useState(() =>
    accountValue(accounts, initialType, transaction?.accountId),
  );

const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    categoryValue(categories, initialType, transaction?.categoryId),
  );

const [transactionDate, setTransactionDate] = useState(
    transaction?.transactionDate ?? `${month}-01`,
  );

const [competenceMonth, setCompetenceMonth] = useState(
    transaction?.competenceMonth ?? month,
  );

const [fundingSource, setFundingSource] = useState<TransactionFundingSource>(
    transaction?.fundingSource ?? "account",
  );

const [isReductionOpen, setIsReductionOpen] = useState(false);

const [reductionSources, setReductionSources] = useState<
    InvestmentReductionSource[]
  >([]);

const [reductionAmountCents, setReductionAmountCents] = useState(0);

const [previousSelections, setPreviousSelections] = useState<
    InvestmentReductionSelection[]
  >([]);

const [pendingPayload, setPendingPayload] =
    useState<TransactionMutationPayload | null>(null);
return { setSelectedType, setSelectedAccountId, setSelectedCategoryId, setTransactionDate, setCompetenceMonth, setFundingSource, setFormError, setOpen, fundingSource, selectedAccountId, selectedCategoryId, setReductionSources, setReductionAmountCents, setPreviousSelections, setPendingPayload, setIsReductionOpen, router, pendingPayload, selectedType, open, startTransition, formId, transactionDate, competenceMonth, formError, isPending, isReductionOpen, reductionAmountCents, previousSelections, reductionSources };
}
