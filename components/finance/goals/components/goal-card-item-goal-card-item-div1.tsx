"use client";

import {
GOAL_CATEGORY_LABELS,
GOAL_STATUS_BADGE_CLASSNAMES,
GOAL_STATUS_LABELS,
} from "@/components/finance/goals/goals-constants";
import { formatGoalTargetMonth } from "@/components/finance/goals/goals-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GoalCardItemDiv1Props } from "@/lib/interfaces/render/goal-card-item-goal-card-item-div1";
import { cn } from "@/lib/utils";
import {
Archive,
ArrowUpFromLine,
CalendarDays,
MoreHorizontal,
Pencil
} from "lucide-react";

export function GoalCardItemDiv1({ goal, onEdit, onRelease, onArchive }: GoalCardItemDiv1Props) {
  return (
<div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--goal-color)_14%,transparent)] px-2 text-xs font-medium text-content-strong">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--goal-color)]" />
                {GOAL_CATEGORY_LABELS[goal.category]}
              </span>
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
            <h3 data-user-content className="break-words text-sm font-semibold text-content-strong">
              {goal.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-content-muted">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              {formatGoalTargetMonth(goal.targetDate)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mt-1 -mr-1 shrink-0"
                aria-label={`Mais ações para ${goal.name}`}
              >
                <MoreHorizontal className="size-4" />
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
  );
}
