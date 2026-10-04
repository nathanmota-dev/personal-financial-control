
export interface PurposeCardDiv1Props {
  purpose: { allocatedCents: number; percentage: number; holdingCount: number; lastAllocatedOn: string; progressPercentage: number | null; allocations: { holdingName: string; createdAt: Date & string; id: string; updatedAt: Date & string; amountCents: number; notes: string | null; holdingId: string; purposeId: string; allocatedOn: string; }[]; name: string; createdAt: Date & string; id: string; isArchived: boolean; updatedAt: Date & string; notes: string | null; kind: "general" | "emergency_reserve"; targetAmountCents: number | null; color: string; activeEmergencyHash: string | null; };
  onAllocate: () => void;
  onEdit: () => void;
  onArchive: () => void;
}
