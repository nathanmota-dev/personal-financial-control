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
    cyan: "text-brand bg-brand/12",
    sky: "text-brand bg-brand/12",
    amber: "text-warning bg-warning/12",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-border bg-surface/75">
      <CardContent className="space-y-3 pt-5">
        <div className={cn(financeIconClassName, tones[tone])}>{icon}</div>
        <div>
          <p className="text-sm text-content">{label}</p>
          <p className="font-heading text-3xl font-semibold tracking-tight text-content-strong">
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-content">{detail}</p>
      </CardContent>
    </Card>
  );
}
