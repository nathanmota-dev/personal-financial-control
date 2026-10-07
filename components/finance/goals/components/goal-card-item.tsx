"use client";

import {
ArrowDownToLine,
WalletCards
} from "lucide-react";
import type { CSSProperties } from "react";
import { GoalCardItemDiv1 } from "./goal-card-item-goal-card-item-div1";

import { Card,CardContent,CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

import { Button } from "@/components/ui/button";
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
  const { formatCurrency } = useFinancialFormatter();
  return (
    <Card
      className="h-full min-w-0 gap-5"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <CardContent className="flex-1 space-y-4">
        <GoalCardItemDiv1 goal={goal} onEdit={onEdit} onRelease={onRelease} onArchive={onArchive} />

        <div>
          <p className="text-xs text-content">Saldo alocado</p>
          <p className="mt-1 break-all text-[27px] font-[650] tracking-[-0.8px] text-content-strong tabular-nums">
            {formatCurrency(goal.allocatedCents)}
          </p>
          <p className="mt-1 text-xs text-content-muted">
            de {formatCurrency(goal.targetAmountCents)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-content">Progresso</span>
            <span className="font-medium text-content-strong">
              {goal.progressPercentage.toFixed(1).replace(".", ",")}%
            </span>
          </div>
          <Progress
            aria-label={`Progresso de ${goal.name}`}
            value={Math.min(100, Math.max(0, goal.progressPercentage))}
            className="h-1.5 bg-surface-elevated [&_[data-slot=progress-indicator]]:bg-[var(--goal-color)]"
          />
          {goal.overfundedCents > 0 ? (
            <p className="text-xs text-warning">
              Excedente: {formatCurrency(goal.overfundedCents)}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <GoalMetric
            label="Restante"
            value={formatCurrency(goal.remainingCents)}
          />
          <GoalMetric
            label="Mensal necessário"
            value={formatCurrency(goal.monthlyRequiredCents)}
          />
        </div>

        {goal.notes ? (
          <p className="break-words text-xs leading-5 text-content">
            {goal.notes}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onAllocate}>
          <ArrowDownToLine className="size-4" />
          Alocar saldo
        </Button>
        <Button
          variant="ghost"
          onClick={onContribute}
          disabled={!canContribute}
        >
          <WalletCards className="size-4" />
          Registrar aporte
        </Button>
      </CardFooter>
    </Card>
  );
}
