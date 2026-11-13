"use client";

import type { CSSProperties } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Card } from "@/components/ui/card";

import { GOAL_CATEGORY_LABELS } from "../goals-constants";
import type { GoalArchiveCardProps } from "../goals-types";
import { GoalMetric } from "./goal-metric";

export function GoalArchiveCard({ goal }: GoalArchiveCardProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <Card
      className="min-w-0 gap-3 rounded-[14px] bg-muted/40 p-4 py-4"
      style={{ "--goal-color": goal.color } as CSSProperties}
    >
      <span className="inline-flex h-6 w-fit items-center gap-1.5 rounded-lg bg-card px-2 text-xs font-medium text-content">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--goal-color)]" />
        {GOAL_CATEGORY_LABELS[goal.category]}
      </span>
      <h3 data-user-content className="text-sm font-semibold text-content-strong">
        {goal.name}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <GoalMetric label="Meta" value={formatCurrency(goal.targetAmountCents)} />
        <GoalMetric label="Histórico alocado" value={formatCurrency(goal.allocatedCents)} />
      </div>
    </Card>
  );
}
