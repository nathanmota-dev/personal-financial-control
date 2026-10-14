import { calculateIncomeTax, progressiveInss, validateCents, validateDependents } from "@/lib/income-tax";
import type { IncomeResult, NetSalaryInput } from "@/lib/interfaces/income-calculators";

export function calculateNetSalary(input: NetSalaryInput): IncomeResult {
  const { grossCents, dependents, discountsCents, benefitsCents, familyDependents = 0, overtimeHours = 0 } = input;
  [grossCents, discountsCents, benefitsCents].forEach(validateCents);
  validateDependents(dependents); validateDependents(familyDependents);
  if (!Number.isFinite(overtimeHours) || overtimeHours < 0 || overtimeHours > 744) throw new Error("Informe de 0 a 744 horas extras.");
  const overtimeCents = Math.round(grossCents / 220 * 1.5 * overtimeHours);
  const taxable = grossCents + overtimeCents;
  const inssLines = progressiveInss(taxable);
  const inss = inssLines.reduce((sum, line) => sum + line.amountCents, 0);
  const ir = calculateIncomeTax(taxable, inss, dependents);
  const family = taxable <= 198038 ? familyDependents * 6754 : 0;
  const proceedsCents = taxable + benefitsCents + family;
  const deductionsCents = inss + ir.taxCents + discountsCents;
  const netCents = proceedsCents - deductionsCents;
  return {
    fgtsCents: Math.round(taxable * 0.08),
    grossCents, proceedsCents, deductionsCents, netCents, netPercentage: proceedsCents ? netCents / proceedsCents * 100 : 0, partial: false,
    lines: [
      { label: "Remuneração bruta", amountCents: grossCents, baseCents: grossCents, rate: 1 },
      { label: "Horas extras", amountCents: overtimeCents, baseCents: grossCents, rate: 1.5 },
      { label: "Benefícios não tributáveis", amountCents: benefitsCents, baseCents: benefitsCents, rate: 0 },
      { label: "Salário-família", amountCents: family, baseCents: taxable, rate: 0 },
      ...inssLines,
      { label: "IRRF", amountCents: ir.taxCents, baseCents: ir.baseCents, rate: ir.rate },
      { label: "Descontos adicionais", amountCents: discountsCents, baseCents: discountsCents, rate: 0 },
    ],
    assumptions: ["Regras mensais de 2026; um vínculo empregatício. Não inclui férias ou 13º salário.",
      "Horas extras: divisor de 220 horas e adicional de 50%. Benefícios informados são não tributáveis.",
      `IRRF: dedução ${ir.simplified ? "simplificada" : "legal"} de R$ ${(ir.deductionCents / 100).toFixed(2)}; redução de R$ ${(ir.reductionCents / 100).toFixed(2)}.`,
      "Salário-família: R$ 67,54 por dependente elegível até remuneração de R$ 1.980,38. Confirme a elegibilidade.",
      ...(netCents < 0 ? ["Os descontos excederam os proventos; o resultado negativo foi preservado."] : [])],
  };
}
