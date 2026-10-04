
export function parseRate(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Informe uma taxa mensal válida.");
  }

  return Math.round(parsed * 100);
}

export function formatRateInput(bps: number) {
  return (bps / 100).toFixed(2).replace(".", ",");
}

export { todayDate } from "@/lib/utils/finance-date";
