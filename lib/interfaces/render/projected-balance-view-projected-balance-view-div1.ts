import type { ProjectionSimulation } from "@/lib/interfaces/projected-balance";

export interface ProjectedBalanceViewDiv1Props {
  hasProjectableAccounts: boolean;
  accounts: import("@/app/interfaces/projected-balance").ProjectedBalanceAccountOption[];
  creditAccounts: import("@/app/interfaces/projected-balance").ProjectedBalanceCreditAccountOption[];
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  loadError: string | undefined;
  visibleProjection: import("@/lib/interfaces/projected-balance").ProjectionCalculationResult | null;
  selectedAccount: import("@/app/interfaces/projected-balance").ProjectedBalanceAccountOption | undefined;
  simulations: ProjectionSimulation[];
  addSimulation: (simulation: ProjectionSimulation) => void;
  removeSimulation: (simulationId: string) => void;
  clearSimulations: () => void;
}
