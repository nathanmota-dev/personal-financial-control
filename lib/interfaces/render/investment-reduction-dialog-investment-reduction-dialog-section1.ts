import type {
InvestmentReductionSource
} from "@/lib/interfaces/investment-reconciliation";

export interface InvestmentReductionDialogSection1Props {
  group: import("@/lib/interfaces/components/investment-reduction-dialog").SourceGroup;
  amounts: Record<string, string>;
  changeAmount: (source: InvestmentReductionSource, value: string) => void;
}
