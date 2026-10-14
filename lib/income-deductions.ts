import type { IncomeDeduction, IncomeResult } from "@/lib/interfaces/income-calculators";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function getIncomeDeductions(result: IncomeResult): IncomeDeduction[] {
  const totals = new Map<string, number>();
  for (const line of result.lines) {
    if (result.annualRevenueCents === undefined && !/^(INSS|IRRF|Descontos adicionais)/.test(line.label)) continue;
    const label = line.label.startsWith("INSS — faixa") ? "INSS" : line.label;
    totals.set(label, (totals.get(label) ?? 0) + line.amountCents);
  }
  return [...totals].map(([label, amountCents], index) => ({
    label, amountCents, color: COLORS[index % COLORS.length],
    percentage: result.deductionsCents ? amountCents / result.deductionsCents * 100 : 0,
  }));
}
