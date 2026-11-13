import { centsToMoneyInput, formatMoneyInput, moneyInputToCents } from "@/lib/finance-ui";
import type { BankReserveShortcut } from "@/lib/interfaces/components/bank-reserve";

/** Common splits of the synced total: nothing, half or everything as reserve. */
export function bankReserveShortcuts(totalCents: number): BankReserveShortcut[] {
  return [
    { label: "Nada", cents: 0 },
    { label: "Metade", cents: Math.floor(totalCents / 2) },
    { label: "Tudo", cents: totalCents },
  ];
}

/** The typed amount in cents, or `null` while the field holds something that is not money. */
export function parseReserveInput(value: string) {
  if (!value.trim()) return 0;
  try {
    const cents = moneyInputToCents(value);
    return cents >= 0 ? cents : null;
  } catch {
    return null;
  }
}

/** Cents in the field's Brazilian format, with thousands separators: 3885412 becomes "38.854,12". */
export function formatReserveInput(cents: number) {
  return formatMoneyInput(centsToMoneyInput(cents));
}
