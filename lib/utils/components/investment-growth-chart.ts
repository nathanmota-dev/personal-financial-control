
export const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatAxisCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}
