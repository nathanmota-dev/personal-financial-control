import type { TaxLine } from "@/lib/interfaces/income-calculators";

export function presumedTaxes(revenueCents: number, services: boolean): TaxLine[] {
  // Receita constante: provisão de um trimestre de outubro/2026, com ambos os tributos majorados.
  const quarter = revenueCents * 3;
  const excess = Math.max(0, quarter - 125000000);
  const irBase = Math.round((quarter + excess * 0.1) * (services ? 0.32 : 0.08));
  const csBase = Math.round((quarter + excess * 0.1) * (services ? 0.32 : 0.12));
  return [
    { label: "IRPJ (provisão mensal)", baseCents: Math.round(irBase / 3), rate: 0.15, amountCents: Math.round(Math.round(irBase * 0.15) / 3) },
    { label: "Adicional de IRPJ", baseCents: Math.round(Math.max(0, irBase - 6000000) / 3), rate: 0.1, amountCents: Math.round(Math.round(Math.max(0, irBase - 6000000) * 0.1) / 3) },
    { label: "CSLL (provisão mensal)", baseCents: Math.round(csBase / 3), rate: 0.09, amountCents: Math.round(Math.round(csBase * 0.09) / 3) },
    ...[["PIS",0.0065],["Cofins",0.03],["ISS de referência",services ? 0.03 : 0]].map(([label, rate]) => ({ label: String(label), baseCents: revenueCents, rate: Number(rate), amountCents: Math.round(revenueCents * Number(rate)) })),
  ];
}
