import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance-ui";

import { GOAL_CATEGORY_LABELS } from "../goals-constants";
import type { GoalArchiveCardProps } from "../goals-types";
import { GoalMetric } from "./goal-metric";

export function GoalArchiveCard({ goal }: GoalArchiveCardProps) {
  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/60">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: goal.color }}
          />
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            {GOAL_CATEGORY_LABELS[goal.category]}
          </Badge>
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-100">
          {goal.name}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <GoalMetric label="Meta" value={formatCurrency(goal.targetAmountCents)} />
          <GoalMetric
            label="Histórico alocado"
            value={formatCurrency(goal.allocatedCents)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
