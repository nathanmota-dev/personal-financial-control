
export interface InvestmentsViewCard1Props {
  isSimulationPickerOpen: boolean;
  setIsSimulationPickerOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  projection: import("@/lib/interfaces/investments").InvestmentProjection | null;
  selectedSimulationDate: Date | undefined;
  applySimulation: (date?: Date) => void;
  minSimulationMonth: Date;
  maxSimulationMonth: Date;
  simulatedMonths: number | null;
  simulatedValue: number | null;
}
