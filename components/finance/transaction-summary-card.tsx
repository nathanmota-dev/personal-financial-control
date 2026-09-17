import { Card, CardContent } from "@/components/ui/card";
import type { TransactionSummaryCardProps } from "@/lib/interfaces/transactions";
import { cn } from "@/lib/utils";

const tones = {
  cyan: "text-brand bg-brand/10",
  blue: "text-brand bg-brand/10",
  sky: "text-brand bg-brand/10",
  amber: "text-warning bg-warning/10",
} as const;

export function TransactionSummaryCard({ label, value, tone }: TransactionSummaryCardProps) {
  return (
    <Card className="rounded-[1.5rem] border-border bg-surface/75">
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm text-content">{label}</p>
        <p className={cn("font-heading text-3xl font-semibold tracking-tight", tones[tone])}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
