import { formatMoneyInput } from "@/lib/finance-ui";

/** Formats a typed digit stream as BRL with two decimal places. */
export function maskMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value.trim() === "-" ? "-" : "";
  const sign = value.trim().startsWith("-") ? "-" : "";
  const normalized = digits.replace(/^0+(?=\d)/, "").padStart(3, "0");
  const whole = normalized.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${whole},${normalized.slice(-2)}`;
}

export function formatPastedMoney(value: string) {
  const cleaned = value.trim().replace(/^R\$\s*/i, "");
  if (!/^-?[\d.,\s]+$/.test(cleaned)) return "";
  return formatMoneyInput(cleaned.replace(/\s/g, ""));
}
