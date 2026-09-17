"use client";

import {
  Archive,
  Pencil,
  Split,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PurposeCardProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

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
      className="rounded-[1.35rem] border bg-surface-raised/45 p-4 transition-colors hover:bg-surface-raised/70"
      style={{ borderColor: purpose.color + "55" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-1.5 size-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
            style={{ backgroundColor: purpose.color, color: purpose.color }}
          />
          <div className="min-w-0">
            <h3 className="truncate font-heading text-lg font-semibold text-content-strong">
              {purpose.name}
            </h3>
            <p className="mt-0.5 text-xs text-content-strong0">
              {purpose.holdingCount}{" "}
              {purpose.holdingCount === 1 ? "ativo relacionado" : "ativos relacionados"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Alocar ativo"
            aria-label={"Alocar ativo em " + purpose.name}
            onClick={onAllocate}
          >
            <Split className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Editar caixinha"
            aria-label={"Editar " + purpose.name}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title={
              purpose.allocatedCents > 0
                ? "Remova o saldo antes de arquivar"
                : "Arquivar caixinha"
            }
            aria-label={"Arquivar " + purpose.name}
            disabled={purpose.allocatedCents > 0}
            onClick={onArchive}
          >
            <Archive className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-heading text-2xl font-semibold text-warning">
            {formatCurrency(purpose.allocatedCents)}
          </p>
          <p className="mt-1 text-xs text-content-strong0">{percentage}% do patrimônio de referência</p>
        </div>
        {purpose.targetAmountCents ? (
          <div className="text-right">
            <p className="text-xs text-content-strong0">Alvo</p>
            <p className="text-sm font-medium text-content">
              {formatCurrency(purpose.targetAmountCents)}
            </p>
          </div>
        ) : null}
      </div>

      {progress !== null ? (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-content-strong0">
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
        <span className="text-content-strong0">
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
