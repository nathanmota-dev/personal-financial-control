
export interface BuildInvestmentReductionPlanContext {
  sourceResult: import("@/lib/interfaces/investment-reconciliation").InvestmentReductionSourcesResult;
  selections: (import("@/lib/interfaces/investment-reconciliation").InvestmentReductionSelection & { sourceType?: import("@/lib/server/investment-reconciliation/validation").SourceSelectionInput["sourceType"]; holdingId?: string; purposeId?: string; allocationId?: string; })[];
}
