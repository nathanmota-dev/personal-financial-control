
export interface ValidateInvestmentReductionPlanContext {
  transaction: Parameters<Parameters<import("@/lib/db").AppDb["transaction"]>[0]>[0];
  allocationReductions: Map<string, number>;
  holdingReductions: Map<string, number>;
}
