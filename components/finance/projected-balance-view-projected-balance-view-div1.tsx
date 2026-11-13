"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ErrorPanel } from "@/components/finance/error-panel";
import { PageHeader } from "@/components/finance/page-header";
import { ProjectedBalanceChart } from "@/components/finance/projected-balance-components/chart";
import { DailyProjectionExplorer } from "@/components/finance/projected-balance-components/daily-projection-explorer";
import { ProjectionFilters } from "@/components/finance/projected-balance-components/filters";
import { ProjectionSimulationDialog } from "@/components/finance/projected-balance-components/projection-simulation-dialog";
import {
ProjectionMarginCard,
ProjectionSummaryCards,
} from "@/components/finance/projected-balance-components/summary";
import { Button } from "@/components/ui/button";
import type { ProjectedBalanceViewDiv1Props } from "@/lib/interfaces/render/projected-balance-view-projected-balance-view-div1";
import { Landmark } from "lucide-react";
import Link from "next/link";

export function ProjectedBalanceViewDiv1({ hasProjectableAccounts, accounts, creditAccounts, filters, loadError, visibleProjection, selectedAccount, addSimulation, removeSimulation }: ProjectedBalanceViewDiv1Props) {
  return (
<div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Saldo projetado"
        title="Saldo projetado"
        description="Leitura diária do caixa previsto, compromissos recorrentes, cartão, aportes e reserva mínima."
      />

      {!hasProjectableAccounts ? (
        <FinanceEmptyState
          title="Nenhuma conta projetável"
          description="Cadastre uma conta corrente, poupança ou dinheiro para liberar o saldo projetado."
          action={
            <Button asChild>
              <Link href="/settings">
                <Landmark className="size-4" />
                Cadastrar conta
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {!loadError && visibleProjection?.daily.length ? (
            <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
              <ProjectionSummaryCards
                summary={visibleProjection.summary}
                selectedAccountName={selectedAccount?.name}
              />
              <ProjectionMarginCard summary={visibleProjection.summary} />
            </div>
          ) : null}

          {loadError ? (
            <>
              <ProjectionFilters accounts={accounts} creditAccounts={creditAccounts} filters={filters} />
              <ErrorPanel title="Filtros inválidos" message={loadError} />
            </>
          ) : visibleProjection ? (
            visibleProjection.daily.length ? (
              <>
                <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
                  <ProjectedBalanceChart
                    daily={visibleProjection.daily}
                    minimumReserveCents={visibleProjection.summary.minimumReserveCents}
                  />
                  <ProjectionFilters accounts={accounts} creditAccounts={creditAccounts} filters={filters} />
                </div>
                <DailyProjectionExplorer
                  daily={visibleProjection.daily}
                  onRemoveSimulation={removeSimulation}
                  actions={<ProjectionSimulationDialog accounts={accounts} filters={filters} onAddSimulation={addSimulation} />}
                />
              </>
            ) : (
              <>
              <ProjectionFilters accounts={accounts} creditAccounts={creditAccounts} filters={filters} />
              <FinanceEmptyState
                title="Projeção sem dias"
                description="Ajuste o período para visualizar a evolução diária do saldo."
              />
              </>
            )
          ) : (
            <>
              <ProjectionFilters accounts={accounts} creditAccounts={creditAccounts} filters={filters} />
              <FinanceEmptyState
              title="Saldo projetado indisponível"
              description="Ajuste os filtros ou confira se as contas possuem dados suficientes para a projeção."
            />
              </>
          )}
        </>
      )}
    </div>
  );
}
