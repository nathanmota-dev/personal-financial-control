import { formatCurrency } from "@/lib/finance-ui";
import type { ReserveFigureProps } from "@/lib/interfaces/investment-reserve";

export function ReserveFigure({ label, value }: ReserveFigureProps) {
  return <div><p className="text-[10px] font-medium text-content-muted">{label}</p><p className={`mt-1 tabular-nums text-lg ${value < 0 ? "text-danger" : "text-content-strong"}`}>{formatCurrency(value)}</p></div>;
}
