import type { ReserveContributionPlan } from "@/lib/interfaces/reserve-contribution";

export type ReserveContributionFormProps = { contribution: ReserveContributionPlan };

export type ReserveContributionSubmitContext = {
  monthlyContributionCents: number | null;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
};
