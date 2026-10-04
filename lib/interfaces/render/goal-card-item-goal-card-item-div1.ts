
export interface GoalCardItemDiv1Props {
  goal: { targetDate: string | null; allocatedCents: number; remainingCents: number; overfundedCents: number; progressPercentage: number; monthlyRequiredCents: number; name: string; createdAt: Date & string; id: string; updatedAt: Date & string; status: "active" | "paused" | "completed" | "archived"; notes: string | null; targetAmountCents: number; color: string; category: "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency" | "other"; plannedMonthlyContributionCents: number; priority: number; };
  onEdit: () => void;
  onRelease: () => void;
  onArchive: () => void;
}
