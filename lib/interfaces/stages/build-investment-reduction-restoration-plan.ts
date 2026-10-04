
export interface BuildInvestmentReductionRestorationPlanContext {
  sources: { id: string; createdAt: Date; updatedAt: Date; amountCents: number; holdingId: string | null; purposeId: string | null; eventId: string; sourceType: "allocation" | "holding_free" | "not_registered"; allocationId: string | null; }[];
}
