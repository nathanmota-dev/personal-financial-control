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
  const { formatCurrency, hidden } = useFinancialFormatter();
  return (
    <Card
      className="relative h-full min-w-0 gap-5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--goal-color)]"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <CardContent className="flex-1 space-y-4">
        <GoalCardItemDiv1 goal={goal} onEdit={onEdit} onRelease={onRelease} onArchive={onArchive} />

        <div className="flex items-center gap-4">
          <div className="relative inline-flex size-[76px] shrink-0 items-center justify-center text-[var(--goal-color)]">
            <svg aria-hidden="true" viewBox="0 0 76 76" className="size-full -rotate-90">
              <circle cx="38" cy="38" r="33" fill="none" strokeWidth="8" className="stroke-current opacity-15" />
              <circle cx="38" cy="38" r="33" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-current" strokeDasharray={207.35} strokeDashoffset={207.35 * (1 - (hidden ? 0 : Math.min(100, Math.max(0, goal.progressPercentage))) / 100)} />
            </svg>
            <span className="absolute text-xs font-semibold text-content-strong tabular-nums">{hidden ? "—" : `${goal.progressPercentage.toFixed(0)}%`}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-content">Saldo alocado</p>
            <p className="break-words text-[24px] leading-8 font-[650] tracking-[-0.6px] text-content-strong tabular-nums">
              {formatCurrency(goal.allocatedCents)}
            </p>
            <p className="text-xs text-content-muted">
              de {formatCurrency(goal.targetAmountCents)}
            </p>
          </div>
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
            value={hidden ? 0 : Math.min(100, Math.max(0, goal.progressPercentage))}
            className="h-2 bg-[color-mix(in_srgb,var(--goal-color)_16%,transparent)] [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-[var(--goal-color)]"
          />
          {goal.overfundedCents > 0 ? (
            <p className="text-xs text-warning">
              Excedente: {formatCurrency(goal.overfundedCents)}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4">
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
          <p data-user-content className="break-words text-xs leading-5 text-content">
            {goal.notes}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-4">
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
