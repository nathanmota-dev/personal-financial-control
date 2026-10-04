import type {
InvestmentReductionSource
} from "@/lib/interfaces/investment-reconciliation";

export type SourceGroup = {
  label: string;
  sources: InvestmentReductionSource[];
};
