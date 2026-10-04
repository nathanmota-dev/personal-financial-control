
export interface InvestmentsViewDiv2Props {
  projection: import("@/lib/interfaces/investments").InvestmentProjection | null;
  contributionHistory: import("@/lib/interfaces/investments").InvestmentContributionHistory;
  cards: { months: number; value: number | null; }[];
  isSimulationPickerOpen: boolean;
  setIsSimulationPickerOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  selectedSimulationDate: Date | undefined;
  applySimulation: (date?: Date) => void;
  minSimulationMonth: Date;
  maxSimulationMonth: Date;
  simulatedMonths: number | null;
  simulatedValue: number | null;
}
