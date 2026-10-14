import type { IncomeTaxResult, TaxLine } from "@/lib/interfaces/income-calculators";

export const INSS_CEILING_CENTS = 847555;
export function validateCents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10000000000) throw new Error("Informe um valor monetário válido, até R$ 100 milhões.");
}
export function validateDependents(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 8) throw new Error("Informe de 0 a 8 dependentes.");
}
export function progressiveInss(grossCents: number): TaxLine[] {
  let previous = 0;
  let accumulated = 0;
  return [[162100, 0.075], [290284, 0.09], [435427, 0.12], [INSS_CEILING_CENTS, 0.14]].map(([ceiling, rate]) => {
    const baseCents = Math.max(0, Math.min(grossCents, ceiling) - previous);
    previous = ceiling;
    const roundedBefore = Math.round(accumulated);
    accumulated += baseCents * rate;
    return { label: `INSS — faixa ${(rate * 100).toLocaleString("pt-BR")}%`, baseCents, rate, amountCents: Math.round(accumulated) - roundedBefore };
  });
}
export function calculateIncomeTax(grossCents: number, inssCents: number, dependents: number): IncomeTaxResult {
  validateCents(grossCents); validateCents(inssCents); validateDependents(dependents);
  const legal = inssCents + dependents * 18959;
  const simplified = legal < 60720;
  const deductionCents = Math.max(legal, 60720);
  const baseCents = Math.max(0, grossCents - deductionCents);
  const bracket = [[242880, 0, 0], [282665, 0.075, 18216], [375105, 0.15, 39416], [466468, 0.225, 67549], [Infinity, 0.275, 90873]].find(([limit]) => baseCents <= limit)!;
  const before = Math.max(0, Math.round(baseCents * bracket[1] - bracket[2]));
  const reductionCents = Math.min(before, grossCents <= 500000 ? 31289 : grossCents <= 735000 ? Math.max(0, Math.round(97862 - 0.133145 * grossCents)) : 0);
  return { baseCents, deductionCents, simplified, rate: bracket[1], taxCents: before - reductionCents, reductionCents };
}
