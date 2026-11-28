import type { InvestmentHistoryStatProps } from "@/lib/interfaces/investment-history";
import { cn } from "@/lib/utils";

const DOT_TONES = {
  brand: "bg-chart-1",
  contrast: "bg-chart-2",
  positive: "bg-success",
  negative: "bg-destructive",
  neutral: "bg-content-subtle",
} as const;

const VALUE_TONES = {
  brand: "text-content-strong",
  contrast: "text-content-strong",
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-content-strong",
} as const;

export function InvestmentHistoryStat({ label, value, detail, tone = "neutral" }: InvestmentHistoryStatProps) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-content"><span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_TONES[tone])} />{label}</dt>
      <dd className={cn("mt-1 break-words text-[15px] font-semibold", VALUE_TONES[tone])}>{value}</dd>
      {detail ? <p className="mt-0.5 text-[11px] text-content-subtle">{detail}</p> : null}
    </div>
  );
}
