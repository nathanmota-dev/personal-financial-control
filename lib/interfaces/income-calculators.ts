export interface TaxLine { label: string; amountCents: number; baseCents: number; rate: number; }
export interface IncomeResult {
  grossCents: number; proceedsCents: number; deductionsCents: number; netCents: number;
  fgtsCents?: number;
  annualRevenueCents?: number; proLaboreCents?: number; dividendsCents?: number;
  netPercentage: number; lines: TaxLine[]; assumptions: string[]; partial: boolean;
}
export interface NetSalaryInput {
  grossCents: number; dependents: number; discountsCents: number; benefitsCents: number;
  familyDependents?: number; overtimeHours?: number;
}
export type PjRegime = "mei" | "simples" | "presumido";
export type PjActivity = "commerce" | "services" | "mixed" | "other";
export interface PjIncomeInput {
  revenueCents: number; regime: PjRegime; activity: PjActivity; annex: number;
  manualRate?: number; proLaboreCents?: number; dependents: number;
}
export interface IncomeFormValues {
  gross: string; dependents: string; discounts: string; benefits: string;
  familyEnabled: boolean; familyDependents: string; overtimeEnabled: boolean; overtime: string;
  regime: PjRegime; activity: PjActivity; annex: string; manualEnabled: boolean; manualRate: string; proLabore: string;
}
export interface IncomeFormProps {
  pj: boolean; values: IncomeFormValues; error: string | null;
  onChange: (values: IncomeFormValues) => void; onSubmit: () => void; onClear: () => void;
}
export interface IncomeResultProps { result: IncomeResult; }
export interface IncomeFieldsProps { values: IncomeFormValues; onChange: (values: IncomeFormValues) => void; }
export interface IncomeCalculatorProps { pj?: boolean; }
export interface IncomeTaxResult { baseCents: number; deductionCents: number; simplified: boolean; rate: number; taxCents: number; reductionCents: number; }

export interface IncomeDeduction { label: string; amountCents: number; percentage: number; color: string; }
export interface IncomeDeductionsChartProps { deductions: IncomeDeduction[]; }
