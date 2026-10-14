import { calculateNetSalary } from "@/lib/net-salary";
import { calculatePjIncome } from "@/lib/pj-income";
import { moneyInputToCents, formatMoneyInput } from "@/lib/finance-ui";
import type { IncomeFormValues } from "@/lib/interfaces/income-calculators";

export const EMPTY_INCOME_VALUES: IncomeFormValues = {
  gross: "", dependents: "0", discounts: "", benefits: "", familyEnabled: false, familyDependents: "0",
  overtimeEnabled: false, overtime: "", regime: "mei", activity: "services", annex: "3", manualEnabled: false, manualRate: "", proLabore: "",
};
export function simulateIncome(values: IncomeFormValues, pj: boolean) {
  if (!values.gross.trim()) throw new Error("Preencha a remuneração ou receita bruta.");
  const cents = (value: string) => value.trim() ? moneyInputToCents(value) : 0;
  const decimal = (value: string) => Number(value.replace(",", "."));
  const gross = cents(values.gross);
  if (gross <= 0) throw new Error("Informe um valor bruto maior que zero.");
  const dependents = Number(values.dependents);
  if (pj) {
    if (values.regime === "simples" && values.manualEnabled && !values.manualRate.trim()) throw new Error("Informe a alíquota manual do DAS.");
    return calculatePjIncome({ revenueCents: gross, regime: values.regime, activity: values.activity, annex: Number(values.annex), dependents,
      proLaboreCents: values.proLabore.trim() ? cents(values.proLabore) : undefined,
      manualRate: values.regime === "simples" && values.manualEnabled ? decimal(values.manualRate) : undefined });
  }
  return calculateNetSalary({ grossCents: gross, dependents, discountsCents: cents(values.discounts), benefitsCents: cents(values.benefits),
    familyDependents: values.familyEnabled ? Number(values.familyDependents) : 0,
    overtimeHours: values.overtimeEnabled ? decimal(values.overtime) : 0 });
}
export function normalizeIncomeValues(values: IncomeFormValues): IncomeFormValues {
  return { ...values, gross: formatMoneyInput(values.gross), discounts: formatMoneyInput(values.discounts), benefits: formatMoneyInput(values.benefits), proLabore: formatMoneyInput(values.proLabore) };
}
