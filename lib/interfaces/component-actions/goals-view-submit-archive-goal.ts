import type {
MutationAction
} from "@/components/finance/goals/goals-types";

export interface GoalsViewSubmitArchiveGoalContext {
  archiveGoal: { targetDate: string | null; allocatedCents: number; remainingCents: number; overfundedCents: number; progressPercentage: number; monthlyRequiredCents: number; notes: string | null; id: string; name: string; createdAt: Date & string; updatedAt: Date & string; status: "active" | "paused" | "completed" | "archived"; category: "other" | "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency"; targetAmountCents: number; plannedMonthlyContributionCents: number; priority: number; color: string; } | null;
  beginMutation: (action: MutationAction) => boolean;
  setArchiveGoal: import("react").Dispatch<import("react").SetStateAction<{ targetDate: string | null; allocatedCents: number; remainingCents: number; overfundedCents: number; progressPercentage: number; monthlyRequiredCents: number; notes: string | null; id: string; name: string; createdAt: Date & string; updatedAt: Date & string; status: "active" | "paused" | "completed" | "archived"; category: "other" | "housing" | "vehicle" | "electronics" | "travel" | "education" | "emergency"; targetAmountCents: number; plannedMonthlyContributionCents: number; priority: number; color: string; } | null>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  endMutation: () => void;
}
