import { describe, expect, it } from "vitest";
import { calculateIncomeTax, progressiveInss, validateCents, validateDependents } from "@/lib/income-tax";
import { calculateNetSalary } from "@/lib/net-salary";
import { calculatePjIncome } from "@/lib/pj-income";
import { simplesRate, SIMPLES_BRACKETS } from "@/lib/simples-national";
import { presumedTaxes } from "@/lib/presumed-income";
import { EMPTY_INCOME_VALUES, normalizeIncomeValues, simulateIncome } from "@/lib/income-simulation";
import type { NetSalaryInput, PjIncomeInput } from "@/lib/interfaces/income-calculators";

const salary: NetSalaryInput = { grossCents: 500000, dependents: 0, discountsCents: 0, benefitsCents: 0 };
const pj: PjIncomeInput = { revenueCents: 1000000, regime: "simples", activity: "services", annex: 3, dependents: 0 };
const amount = (result: ReturnType<typeof calculatePjIncome>, label: string) => result.lines.find(line => line.label === label)!.amountCents;

describe("2026 monthly payroll", () => {
  it.each([0, 162100, 162101, 290284, 290285, 435427, 435428, 847555, 847556, 10000000])("caps progressive INSS for %i cents", gross => {
    const lines = progressiveInss(gross);
    expect(lines.reduce((sum, line) => sum + line.baseCents, 0)).toBe(Math.min(gross, 847555));
    expect(lines.reduce((sum, line) => sum + line.amountCents, 0)).toBeLessThanOrEqual(98809);
  });
  it("uses only the most favorable deduction", () => {
    expect(calculateIncomeTax(500000, 0, 0)).toMatchObject({ simplified: true, deductionCents: 60720, taxCents: 0 });
    expect(calculateIncomeTax(800000, 70000, 2)).toMatchObject({ simplified: false, deductionCents: 107918, baseCents: 692082, reductionCents: 0 });
  });
  it.each([499999, 500000, 500001, 734999, 735000, 735001])("applies reduction at gross %i", gross => {
    const ir = calculateIncomeTax(gross, 0, 0);
    if (gross <= 500000) expect(ir.taxCents).toBe(0);
    else if (gross <= 735000) expect(ir.reductionCents).toBe(Math.max(0, Math.round(97862 - 0.133145 * gross)));
    else expect(ir.reductionCents).toBe(0);
    expect(ir.taxCents).toBeGreaterThanOrEqual(0);
  });
  it.each([[0,0],[242880,0],[282665,0.075],[375105,0.15],[466468,0.225],[466469,0.275]])("uses IRRF base bracket %i", (base, rate) => {
    expect(calculateIncomeTax(base + 60720, 0, 0).rate).toBe(rate);
  });
  it("includes overtime in taxation, benefits and family only in proceeds", () => {
    const result = calculateNetSalary({ ...salary, grossCents: 162100, overtimeHours: 10, benefitsCents: 20000, familyDependents: 2 });
    expect(result.proceedsCents).toBe(162100 + 11052 + 20000 + 13508);
    expect(result.lines.find(line => line.label === "IRRF")!.baseCents).toBe(173152 - 60720);
    expect(result.netCents).toBe(result.proceedsCents - result.deductionsCents);
  });
  it("cuts off salary family after remuneration threshold, including overtime", () => {
    const family = (grossCents: number, overtimeHours = 0) => amount(calculateNetSalary({ ...salary, grossCents, familyDependents: 1, overtimeHours }), "Salário-família");
    expect(family(198038)).toBe(6754); expect(family(198039)).toBe(0); expect(family(198038,1)).toBe(0);
  });
  it("keeps negative net results and handles zero proceeds", () => {
    const result = calculateNetSalary({ ...salary, discountsCents: 1000000 });
    expect(result.netCents).toBeLessThan(0); expect(result.assumptions.join(" ")).toContain("excederam");
    expect(calculateNetSalary({ ...salary, grossCents: 0 }).netPercentage).toBe(0);
  });
  it.each([-1, NaN, Infinity, 1.1, 10000000001])("rejects invalid cents %s", value => expect(() => validateCents(value)).toThrow());
  it.each([-1,9,1.5,NaN])("rejects invalid dependents %s", value => expect(() => validateDependents(value)).toThrow());
  it.each([-1,745,NaN])("rejects invalid overtime %s", overtimeHours => expect(() => calculateNetSalary({ ...salary, overtimeHours })).toThrow());
});

describe("2026 company income", () => {
  it.each([["commerce",8205],["services",8605],["mixed",8705]] as const)("MEI %s does not double count INSS", (activity, das) => {
    const result = calculatePjIncome({ ...pj, revenueCents: 500000, regime: "mei", activity });
    expect(amount(result,"DAS MEI (inclui INSS)")).toBe(das);
    expect(amount(result,"INSS do pró-labore")).toBe(0); expect(result.netCents).toBe(500000 - das);
    const withProLabore = calculatePjIncome({ ...pj, revenueCents: 500000, regime: "mei", activity, proLaboreCents: 300000 });
    expect(withProLabore.netCents).toBe(result.netCents);
  });
  it.each([1,2,3,4,5])("covers all six brackets in annex %i", annex => {
    [18000000,36000000,72000000,180000000,360000000,480000000].forEach((annual, index) => {
      const bracket = simplesRate(annual, annex);
      const [nominal,deduction] = SIMPLES_BRACKETS[annex as keyof typeof SIMPLES_BRACKETS][index];
      expect(bracket.bracket).toBe(index + 1); expect(bracket.rate).toBeCloseTo(nominal / 100 - deduction * 100 / annual);
      if (index < 5) expect(simplesRate(annual + 1, annex).bracket).toBe(index + 2);
      const result = calculatePjIncome({ ...pj, annex, revenueCents: Math.floor(annual / 12) });
      expect(result.netCents).toBe(result.grossCents - result.deductionsCents);
    });
  });
  it("uses manual DAS including zero and marks missing outside taxes", () => {
    expect(amount(calculatePjIncome({ ...pj, manualRate: 10 }), "DAS Simples Nacional")).toBe(100000);
    expect(amount(calculatePjIncome({ ...pj, manualRate: 0 }), "DAS Simples Nacional")).toBe(0);
    expect(calculatePjIncome({ ...pj, manualRate: 10 }).partial).toBe(true);
    expect(calculatePjIncome({ ...pj, revenueCents: 30000001 }).partial).toBe(true);
    expect(simplesRate(0,3).rate).toBe(0.06);
  });
  it("defaults to minimum salary, caps individual INSS, and adds employer only when due", () => {
    expect(amount(calculatePjIncome(pj),"INSS do pró-labore")).toBe(17831);
    expect(amount(calculatePjIncome(pj),"Contribuição patronal")).toBe(0);
    expect(amount(calculatePjIncome({ ...pj, annex: 4 }),"Contribuição patronal")).toBe(32420);
    expect(amount(calculatePjIncome({ ...pj, proLaboreCents: 900000 }),"INSS do pró-labore")).toBe(93231);
    expect(amount(calculatePjIncome({ ...pj, regime: "presumido" }),"Contribuição patronal")).toBe(32420);
  });
  it("provisions presumido taxes and uses distinct IRPJ and CSLL bases for other activities", () => {
    const services = calculatePjIncome({ ...pj, regime: "presumido" });
    expect(amount(services,"IRPJ (provisão mensal)")).toBe(48000); expect(amount(services,"CSLL (provisão mensal)")).toBe(28800);
    expect(amount(services,"PIS")).toBe(6500); expect(amount(services,"Cofins")).toBe(30000); expect(amount(services,"ISS de referência")).toBe(30000);
    const other = calculatePjIncome({ ...pj, regime: "presumido", activity: "other" });
    expect(other.partial).toBe(true); expect(amount(other,"IRPJ (provisão mensal)")).toBe(12000); expect(amount(other,"CSLL (provisão mensal)")).toBe(10800); expect(amount(other,"ISS de referência")).toBe(0);
    expect(presumedTaxes(50000000,true)[0].baseCents).toBe(16266667);
    expect(presumedTaxes(50000000,true)[1].amountCents).toBeGreaterThan(0);
  });
  it("withholds 10% over the entire dividend only above 50 thousand", () => {
    const at = calculatePjIncome({ ...pj, revenueCents: 5000000, proLaboreCents: 0, manualRate: 0 });
    const above = calculatePjIncome({ ...pj, revenueCents: 5000001, proLaboreCents: 0, manualRate: 0 });
    expect(amount(at,"IRRF sobre dividendos")).toBe(0); expect(amount(above,"IRRF sobre dividendos")).toBe(500000);
  });
  it("handles zero and negative income without negative dividends", () => {
    expect(calculatePjIncome({ ...pj, revenueCents: 0, proLaboreCents: 0 }).netPercentage).toBe(0);
    const result = calculatePjIncome({ ...pj, manualRate: 100 });
    expect(result.netCents).toBeLessThan(0); expect(amount(result,"IRRF sobre dividendos")).toBe(0);
  });
  it.each([
    { regime: "mei", revenueCents: 675001 }, { revenueCents: 40000001 }, { regime: "presumido", revenueCents: 650000001 },
    { proLaboreCents: 1000001 }, { manualRate: -1 }, { manualRate: 101 }, { manualRate: NaN }, { regime: "bad" }, { activity: "bad" }, { regime: "mei", activity: "other" }, { annex: 6 },
  ])("rejects invalid scenario %j", patch => expect(() => calculatePjIncome({ ...pj, ...patch } as PjIncomeInput)).toThrow());
  it("accepts revenue at each regime's annual limit", () => {
    expect(calculatePjIncome({ ...pj, regime: "mei", revenueCents: 675000 })).toBeTruthy();
    expect(calculatePjIncome({ ...pj, revenueCents: 40000000 })).toBeTruthy();
    expect(calculatePjIncome({ ...pj, regime: "presumido", revenueCents: 650000000 })).toBeTruthy();
    expect(() => simplesRate(480000001, 1)).toThrow();
  });
});

describe("form simulation", () => {
  it("normalizes currency and ignores disabled optional fields", () => {
    const values = normalizeIncomeValues({ ...EMPTY_INCOME_VALUES, gross: "5000", overtime: "9999", familyDependents: "9" });
    expect(values.gross).toBe("5.000,00");
    expect(simulateIncome(values,false)).toEqual(calculateNetSalary(salary));
    expect(simulateIncome({ ...values, regime: "simples", manualEnabled: false, manualRate: "999" },true)).toBeTruthy();
    expect(simulateIncome({ ...values, overtimeEnabled: true, overtime: "2,5" },false).proceedsCents).toBeGreaterThan(500000);
  });
  it("uses optional/manual values when enabled and rejects missing inputs", () => {
    expect(() => simulateIncome(EMPTY_INCOME_VALUES,false)).toThrow("Preencha");
    expect(() => simulateIncome({ ...EMPTY_INCOME_VALUES, gross: "0" },false)).toThrow("maior");
    const values = { ...EMPTY_INCOME_VALUES, gross: "10000", regime: "simples" as const, manualEnabled: true, manualRate: "5,5", proLabore: "2000" };
    expect(amount(simulateIncome(values,true),"DAS Simples Nacional")).toBe(55000);
    expect(() => simulateIncome({ ...values, manualRate: "" },true)).toThrow("manual");
    expect(amount(simulateIncome({ ...EMPTY_INCOME_VALUES, gross: "1621", familyEnabled: true, familyDependents: "1" },false),"Salário-família")).toBe(6754);
  });
});
