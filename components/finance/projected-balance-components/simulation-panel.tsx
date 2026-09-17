"use client";

import { Sparkles, Trash2 } from "lucide-react";

import type {
  ProjectionSimulationPanelProps,
} from "@/app/interfaces/projected-balance";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { ProjectionSimulationDialog } from "./projection-simulation-dialog";

export function ProjectionSimulationPanel({
  accounts,
  filters,
  simulations,
  onAddSimulation,
  onRemoveSimulation,
  onClearSimulations,
}: ProjectionSimulationPanelProps) {
  return (
    <Card className="rounded-[1.75rem] border-brand/15 bg-surface/75 shadow-[0_24px_80px_rgb(var(--surface-rgb) / .22)]">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Simulador de compras</CardTitle>
            <p className="mt-1 text-sm leading-6 text-content">
              Teste uma despesa no calendário sem criar um lançamento real.
            </p>
          </div>
        </div>
        <ProjectionSimulationDialog
          accounts={accounts}
          filters={filters}
          onAddSimulation={onAddSimulation}
        />
      </CardHeader>

      {simulations.length ? (
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between gap-3 text-xs text-content-strong0">
            <span>
              {simulations.length} {simulations.length === 1 ? "compra simulada" : "compras simuladas"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-content hover:bg-danger/10 hover:text-danger"
              onClick={onClearSimulations}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Limpar simulações
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {simulations.map((simulation) => (
              <div
                key={simulation.id}
                className={cn(
                  financeItemClassName,
                  "border-dashed border-warning/25 bg-warning/[0.05] p-3"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-content-strong">
                        {simulation.description}
                      </p>
                      <Badge className="bg-warning/10 text-warning ring-1 ring-warning/25">
                        Simulação
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-content-strong0">
                      {formatDateLabel(simulation.date)} · {simulation.accountName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-content-strong0 hover:bg-danger/10 hover:text-danger"
                    aria-label={`Remover simulação ${simulation.description}`}
                    onClick={() => onRemoveSimulation(simulation.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-3 font-mono text-sm font-semibold tabular-nums text-danger">
                  -{formatCurrency(simulation.amountCents)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-0 text-sm text-content-strong0">
          Nenhuma simulação ativa. A projeção atual considera apenas os eventos cadastrados.
        </CardContent>
      )}
    </Card>
  );
}
