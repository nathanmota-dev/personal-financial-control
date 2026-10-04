import type {
InvestmentReductionSource
} from "@/lib/interfaces/investment-reconciliation";

export interface InvestmentReductionDialogDiv2Props {
  amountCents: number;
  selectedCents: number;
  groupedSources: import("@/lib/interfaces/components/investment-reduction-dialog").SourceGroup[];
  amounts: Record<string, string>;
  changeAmount: (source: InvestmentReductionSource, value: string) => void;
  isClosed: boolean;
  remainingCents: number;
  footerNote: import("react").ReactNode;
}
