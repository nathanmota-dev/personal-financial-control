"use client";

import { PurposeCardDiv1 } from "./purpose-card-purpose-card-div1";

import { Progress } from "@/components/ui/progress";
import { formatCurrency,formatDateLabel } from "@/lib/finance-ui";
import type { PurposeCardProps } from "@/lib/interfaces/investment-portfolio";

export function PurposeCard({
  purpose,
  comparisonBalanceCents,
  onEdit,
  onAllocate,
  onArchive,
}: PurposeCardProps) {
  const percentage = purpose.percentage.toFixed(1).replace(".", ",");
  const progress = purpose.progressPercentage;

  return (
    <article
      className="rounded-xl border bg-card p-4 transition-colors hover:bg-card"
      style={{ borderColor: purpose.color + "55" }}
    >
      <PurposeCardDiv1 purpose={purpose} onAllocate={onAllocate} onEdit={onEdit} onArchive={onArchive} />

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-warning">
            {formatCurrency(purpose.allocatedCents)}
          </p>
          <p className="mt-1 text-xs text-content">{percentage}% do patrimônio de referência</p>
        </div>
        {purpose.targetAmountCents ? (
          <div className="text-right">
            <p className="text-xs text-content">Alvo</p>
            <p className="text-sm font-medium text-content">
              {formatCurrency(purpose.targetAmountCents)}
            </p>
          </div>
        ) : null}
      </div>

      {progress !== null ? (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-content">
            <span>Progresso do alvo</span>
            <span>{progress.toFixed(0).replace(".", ",")}%</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 bg-surface-elevated [&_[data-slot=progress-indicator]]:bg-[var(--purpose-color)]"
            style={{ "--purpose-color": purpose.color } as React.CSSProperties}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3 text-xs">
        <span className="text-content">
          {purpose.lastAllocatedOn
            ? "Última alocação em " + formatDateLabel(purpose.lastAllocatedOn)
            : "Sem alocações ainda"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-content">
          <span className="size-1.5 rounded-full bg-brand/70" />
          {comparisonBalanceCents > 0 ? "Base reconciliável" : "Sem saldo de referência"}
        </span>
      </div>
    </article>
  );
}
