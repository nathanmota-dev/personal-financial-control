import { Card, CardContent } from "@/components/ui/card";
import type { SummaryMetricProps } from "@/lib/interfaces/investment-portfolio";
import { cn } from "@/lib/utils";

export function SummaryMetric({ label, value, detail, icon, tone }: SummaryMetricProps) {
  const toneClassName = {
    cyan: "border-cyan-400/15 bg-cyan-400/8 text-cyan-200",
    sky: "border-sky-400/15 bg-sky-400/8 text-sky-200",
    teal: "border-teal-400/15 bg-teal-400/8 text-teal-200",
    amber: "border-amber-400/15 bg-amber-400/8 text-amber-200",
  }[tone];

  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-3 pt-4">
        <div className={cn("inline-flex rounded-full border p-2", toneClassName)}>{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-slate-100">
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}
