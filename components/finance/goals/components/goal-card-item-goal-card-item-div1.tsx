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
            <h3 data-user-content className="break-words text-base font-semibold text-content-strong">
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
  );
}
