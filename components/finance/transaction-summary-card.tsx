import { Card, CardContent } from "@/components/ui/card";
import type { TransactionSummaryCardProps } from "@/lib/interfaces/transactions";
import { cn } from "@/lib/utils";

const tones = {
  cyan: "text-cyan-300 bg-cyan-500/10",
  blue: "text-blue-300 bg-blue-500/10",
  sky: "text-sky-300 bg-sky-500/10",
  amber: "text-amber-300 bg-amber-500/10",
} as const;

export function TransactionSummaryCard({ label, value, tone }: TransactionSummaryCardProps) {
  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={cn("font-heading text-3xl font-semibold tracking-tight", tones[tone])}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
