import { describe, expect, it } from "vitest";
import { getIncomeDeductions } from "@/lib/income-deductions";
import { calculateNetSalary } from "@/lib/net-salary";
import { calculatePjIncome } from "@/lib/pj-income";

const salary = { grossCents: 600000, dependents: 0, discountsCents: 10000, benefitsCents: 20000 };

describe("income deduction overview", () => {
  it("groups progressive INSS and reconciles every deduction without including proceeds or FGTS", () => {
    const result = calculateNetSalary({ ...salary, overtimeHours: 10 });
    const deductions = getIncomeDeductions(result);
    expect(deductions.map(item => item.label)).toEqual(["INSS", "IRRF", "Descontos adicionais"]);
    expect(deductions[0].amountCents).toBe(result.lines.filter(line => line.label.startsWith("INSS")).reduce((sum, line) => sum + line.amountCents, 0));
    expect(deductions.reduce((sum, item) => sum + item.amountCents, 0)).toBe(result.deductionsCents);
    const overtime = result.lines.find(line => line.label === "Horas extras")!.amountCents;
    expect(result.fgtsCents).toBe(Math.round((salary.grossCents + overtime) * 0.08));
    expect(result.netCents).toBe(result.proceedsCents - result.deductionsCents);
    expect(deductions.reduce((sum, item) => sum + item.percentage, 0)).toBeCloseTo(100);
  });
  it("keeps zero deductions finite", () => {
    const result = calculateNetSalary({ ...salary, grossCents: 0, discountsCents: 0 });
    expect(result.fgtsCents).toBe(0);
    expect(getIncomeDeductions(result).every(item => item.percentage === 0)).toBe(true);
  });
  it.each(["mei", "simples", "presumido"] as const)("reconciles %s taxes and does not invent FGTS", regime => {
    const result = calculatePjIncome({ revenueCents: 500000, regime, activity: "services", annex: 3, dependents: 0 });
    expect(getIncomeDeductions(result).reduce((sum, item) => sum + item.amountCents, 0)).toBe(result.deductionsCents);
    expect(result.fgtsCents).toBeUndefined();
  });
});
