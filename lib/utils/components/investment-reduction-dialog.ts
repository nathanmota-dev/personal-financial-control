import { centsToMoneyInput,moneyInputToCents } from "@/lib/finance-ui";
import type { SourceGroup } from "@/lib/interfaces/components/investment-reduction-dialog";
import type {
InvestmentReductionDialogProps,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";

export function groupSources(sources: InvestmentReductionSource[]): SourceGroup[] {
  const groups = new Map<string, InvestmentReductionSource[]>();

  for (const source of sources) {
    const label = source.sourceType === "not_registered" ? "Fora da carteira cadastrada" : source.holdingName ?? "Ativos";
    const current = groups.get(label) ?? [];
    current.push(source);
    groups.set(label, current);
  }

  return [...groups.entries()].map(([label, groupedSources]) => ({
    label,
    sources: groupedSources,
  }));
}

export function parseInputCents(value: string) {
  if (!value.trim()) {
    return 0;
  }

  try {
    return Math.max(moneyInputToCents(value), 0);
  } catch {
    return 0;
  }
}

export function buildInitialAmounts(
  selections: InvestmentReductionDialogProps["initialSelections"]
) {
  const amounts: Record<string, string> = {};

  for (const selection of selections ?? []) {
    amounts[selection.sourceId] = centsToMoneyInput(selection.amountCents);
  }

  return amounts;
}
