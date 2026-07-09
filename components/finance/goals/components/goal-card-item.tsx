"use client";

import type { CSSProperties } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import {
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_BADGE_CLASSNAMES,
  GOAL_STATUS_LABELS,
} from "../goals-constants";
import type { GoalCardItemProps } from "../goals-types";
import { formatGoalTargetMonth } from "../goals-utils";
import { GoalMetric } from "./goal-metric";
import { IconButton } from "./icon-button";

export function GoalCardItem({
  goal,
  onAllocate,
  onRelease,
  onContribute,
  onEdit,
  onArchive,
  canContribute,
}: GoalCardItemProps) {
  return (
    <Card
      className="overflow-hidden rounded-[1.5rem] border-slate-800 bg-slate-950/75"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <CardContent className="space-y-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              <Badge variant="outline" className="border-slate-700 text-slate-200">
                {GOAL_CATEGORY_LABELS[goal.category]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-slate-700",
                  GOAL_STATUS_BADGE_CLASSNAMES[goal.status]
                )}
              >
                {GOAL_STATUS_LABELS[goal.status]}
              </Badge>
            </div>
            <h3 className="truncate font-heading text-xl font-semibold text-slate-100">
              {goal.name}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {formatGoalTargetMonth(goal.targetDate)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconButton label="Alocar saldo" onClick={onAllocate}>
              <ArrowDownToLine className="size-4" />
            </IconButton>
            <IconButton label="Liberar saldo" onClick={onRelease}>
              <ArrowUpFromLine className="size-4" />
            </IconButton>
            <IconButton
              label="Registrar aporte"
              onClick={onContribute}
              disabled={!canContribute}
            >
              <WalletCards className="size-4" />
            </IconButton>
            <IconButton label="Editar meta" onClick={onEdit}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="Arquivar meta" onClick={onArchive}>
              <Archive className="size-4" />
            </IconButton>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-400">Progresso</span>
            <span className="font-medium text-slate-100">
              {goal.progressPercentage.toFixed(1).replace(".", ",")}%
            </span>
          </div>
          <Progress
            value={goal.progressPercentage}
            className="h-2 bg-slate-800 [&_[data-slot=progress-indicator]]:bg-[var(--goal-color)]"
          />
          {goal.overfundedCents > 0 ? (
            <p className="text-xs text-teal-200">
              Excedente: {formatCurrency(goal.overfundedCents)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <GoalMetric label="Meta" value={formatCurrency(goal.targetAmountCents)} />
          <GoalMetric label="Alocado" value={formatCurrency(goal.allocatedCents)} />
          <GoalMetric label="Restante" value={formatCurrency(goal.remainingCents)} />
          <GoalMetric
            label="Mensal necessário"
            value={formatCurrency(goal.monthlyRequiredCents)}
          />
        </div>

        {goal.notes ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-300">
            {goal.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
