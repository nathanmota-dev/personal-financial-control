import { Card, CardContent } from "@/components/ui/card";
import { financeIconClassName } from "@/components/finance/finance-styles";
import type { InvestmentSummaryCardProps } from "@/lib/interfaces/investments";
import { cn } from "@/lib/utils";

export function InvestmentSummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: InvestmentSummaryCardProps) {
  const tones = {
    cyan: "text-cyan-300 bg-cyan-500/12",
    sky: "text-sky-300 bg-sky-500/12",
    amber: "text-amber-300 bg-amber-500/12",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-3 pt-5">
        <div className={cn(financeIconClassName, tones[tone])}>{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="font-heading text-3xl font-semibold tracking-tight text-slate-100">
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}
