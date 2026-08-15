"use client";

import {
  CircleDollarSign,
  Plus,
  Target,
} from "lucide-react";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurposeCardsProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency } from "@/lib/finance-ui";
import { PurposeCard } from "@/components/finance/investment-portfolio/purpose-card";

export function PurposeCards({
  dashboard,
  onCreate,
  onEdit,
  onAllocate,
  onArchive,
}: PurposeCardsProps) {
  return (
    <Card className={financePanelClassName + " h-full"}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-teal-200">
            <Target className="size-4" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
              Finalidades
            </span>
          </div>
          <CardTitle className="text-xl text-slate-100">Caixinhas patrimoniais</CardTitle>
          <p className="mt-1 max-w-lg text-sm leading-6 text-slate-400">
            Dê uma intenção ao patrimônio atual. Uma caixinha pode reunir partes de vários ativos.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCreate}>
          <Plus className="size-4" />
          Nova
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {dashboard.purposes.length ? (
          dashboard.purposes.map((purpose) => (
            <PurposeCard
              key={purpose.id}
              purpose={purpose}
              comparisonBalanceCents={dashboard.comparisonBalanceCents}
              onEdit={() => onEdit(purpose)}
              onAllocate={() => onAllocate(purpose)}
              onArchive={() => onArchive(purpose)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 px-5 py-8 text-center">
            <CircleDollarSign className="mx-auto size-6 text-teal-300" />
            <p className="mt-3 font-heading text-lg font-semibold text-slate-100">
              Nenhuma caixinha criada
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Crie a primeira finalidade para começar a classificar os ativos.
            </p>
          </div>
        )}

        {dashboard.unclassifiedCents > 0 ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-amber-300/25 bg-amber-300/[0.06] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2.5 shrink-0 rounded-full bg-amber-300" />
              <div className="min-w-0">
                <p className="font-medium text-amber-100">Não classificado</p>
                <p className="truncate text-xs text-amber-100/60">
                  Saldo disponível sem finalidade definida
                </p>
              </div>
            </div>
            <p className="shrink-0 font-heading text-lg font-semibold text-amber-200">
              {formatCurrency(dashboard.unclassifiedCents)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
