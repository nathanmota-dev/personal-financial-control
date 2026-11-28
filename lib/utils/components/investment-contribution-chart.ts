import type { InvestmentContributionHistory } from "@/lib/interfaces/investments";

export const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Money the bank reports for the months the platform did not record. */
export function bankBackfillCents({ bankBackfill }: InvestmentContributionHistory) {
  return bankBackfill ? bankBackfill.positionsCents + bankBackfill.adjustmentCents : 0;
}

export function contributionHistoryDescription(history: InvestmentContributionHistory) {
  return history.bankBackfill
    ? "Lançamentos realizados e, antes deles, os investimentos do banco pela data de compra, sem rendimento"
    : "Histórico dos lançamentos realizados, sem misturar rendimento estimado";
}
