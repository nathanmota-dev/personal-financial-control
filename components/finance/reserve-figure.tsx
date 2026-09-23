import { formatCurrency } from "@/lib/finance-ui";
import type { ReserveFigureProps } from "@/lib/interfaces/investment-reserve";

export function ReserveFigure({ label, value }: ReserveFigureProps) {
  return <div><p className="text-[10px] uppercase tracking-wider text-content-muted">{label}</p><p className={`mt-1 font-mono text-lg ${value < 0 ? "text-rose-300" : "text-content-strong"}`}>{formatCurrency(value)}</p></div>;
}
