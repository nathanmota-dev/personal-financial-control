
export interface AllocationDialogPortfolioField1Props {
  form: import("@/lib/interfaces/investment-portfolio").AllocationFormState;
  setForm: import("react").Dispatch<import("react").SetStateAction<import("@/lib/interfaces/investment-portfolio").AllocationFormState>>;
  isExisting: boolean;
  purposes: { allocatedCents: number; percentage: number; holdingCount: number; lastAllocatedOn: string; progressPercentage: number | null; allocations: { holdingName: string; id: string; createdAt: Date & string; updatedAt: Date & string; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; }[]; id: string; name: string; isArchived: boolean; createdAt: Date & string; updatedAt: Date & string; notes: string | null; kind: "general" | "emergency_reserve"; targetAmountCents: number | null; color: string; activeEmergencyHash: string | null; }[];
}
