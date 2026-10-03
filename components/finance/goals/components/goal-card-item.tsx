"use client";

import type { CSSProperties } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
  WalletCards,
  MoreHorizontal,
  CalendarDays,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
      className="h-full min-w-0 gap-5"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <CardContent className="flex-1 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              <Badge
                variant="outline"
                className="border-input text-content-strong"
              >
                {GOAL_CATEGORY_LABELS[goal.category]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-input",
                  GOAL_STATUS_BADGE_CLASSNAMES[goal.status],
                )}
              >
                {GOAL_STATUS_LABELS[goal.status]}
              </Badge>
            </div>
            <h3 className="break-words text-base font-semibold text-content-strong">
              {goal.name}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-xs text-content">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              {formatGoalTargetMonth(goal.targetDate)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Mais ações para ${goal.name}`}
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Editar meta
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onRelease}>
                <ArrowUpFromLine />
                Liberar saldo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onArchive}>
                <Archive />
                Arquivar meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <p className="text-xs text-content">Saldo alocado</p>
          <p className="mt-1 break-all text-[27px] font-semibold tracking-tight text-content-strong tabular-nums">
            {formatCurrency(goal.allocatedCents)}
          </p>
          <p className="mt-1 text-sm text-content">
            de {formatCurrency(goal.targetAmountCents)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
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
          <p className="break-words text-sm leading-6 text-content">
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
