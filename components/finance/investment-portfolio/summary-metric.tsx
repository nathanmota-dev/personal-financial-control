import { Card, CardContent } from "@/components/ui/card";
import type { SummaryMetricProps } from "@/lib/interfaces/investment-portfolio";
import { cn } from "@/lib/utils";

export function SummaryMetric({ label, value, detail, icon, tone }: SummaryMetricProps) {
  const toneClassName = {
    cyan: "border-brand/15 bg-brand/8 text-brand",
    sky: "border-brand/15 bg-brand/8 text-brand",
    teal: "border-warning/15 bg-warning/8 text-warning",
    amber: "border-warning/15 bg-warning/8 text-warning",
  }[tone];

  return (
    <Card className="rounded-[1.5rem] border-border bg-surface/75">
      <CardContent className="space-y-3 pt-4">
        <div className={cn("inline-flex rounded-full border p-2", toneClassName)}>{icon}</div>
        <div>
          <p className="text-sm text-content">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-content-strong">
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-content">{detail}</p>
      </CardContent>
    </Card>
  );
}
