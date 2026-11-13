"use client";

import {
ArrowDownToLine,
WalletCards
} from "lucide-react";
import type { CSSProperties } from "react";
import { GoalCardItemDiv1 } from "./goal-card-item-goal-card-item-div1";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { GoalCardItemProps } from "../goals-types";
import { GoalMetric } from "./goal-metric";

export function GoalCardItem({
  goal,
  onAllocate,
  onRelease,
  onContribute,
  onEdit,
  onArchive,
  canContribute,
}: GoalCardItemProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const progress = hidden ? 0 : Math.min(100, Math.max(0, goal.progressPercentage));
  return (
    <Card
      className="h-full min-w-0 gap-4 rounded-[14px] p-4 py-4 transition-colors hover:border-content-subtle/40"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <GoalCardItemDiv1 goal={goal} onEdit={onEdit} onRelease={onRelease} onArchive={onArchive} />

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <p className="min-w-0 text-xl leading-7 font-semibold tracking-tight break-words tabular-nums text-content-strong">
            {formatCurrency(goal.allocatedCents)}
            <span className="ml-1.5 text-xs font-medium text-content-muted">de {formatCurrency(goal.targetAmountCents)}</span>
          </p>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {hidden ? "—" : `${goal.progressPercentage.toFixed(1).replace(".", ",")}%`}
          </span>
        </div>
        <Progress
          aria-label={`Progresso de ${goal.name}`}
          value={progress}
          className="tone-stripes tone-neutral h-2.5 bg-transparent [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--goal-color)]"
        />
        {goal.overfundedCents > 0 ? (
          <p className="text-xs text-warning">
            Excedente: {formatCurrency(goal.overfundedCents)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GoalMetric label="Restante" value={formatCurrency(goal.remainingCents)} />
        <GoalMetric label="Mensal necessário" value={formatCurrency(goal.monthlyRequiredCents)} />
      </div>

      {goal.notes ? (
        <p data-user-content className="break-words text-xs leading-5 text-content">
          {goal.notes}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" onClick={onAllocate}>
          <ArrowDownToLine className="size-4" />
          Alocar saldo
        </Button>
        <Button variant="ghost" size="sm" onClick={onContribute} disabled={!canContribute}>
          <WalletCards className="size-4" />
          Registrar aporte
        </Button>
      </div>
    </Card>
  );
}
