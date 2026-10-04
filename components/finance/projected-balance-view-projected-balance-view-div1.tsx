"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ErrorPanel } from "@/components/finance/error-panel";
import { PageHeader } from "@/components/finance/page-header";
import { ProjectedBalanceChart } from "@/components/finance/projected-balance-components/chart";
import { DailyProjectionExplorer } from "@/components/finance/projected-balance-components/daily-projection-explorer";
import { ProjectionFilters } from "@/components/finance/projected-balance-components/filters";
import { ProjectionSimulationPanel } from "@/components/finance/projected-balance-components/simulation-panel";
import {
ProjectionAlerts,
ProjectionSummaryCards,
} from "@/components/finance/projected-balance-components/summary";
import { Button } from "@/components/ui/button";
import type { ProjectedBalanceViewDiv1Props } from "@/lib/interfaces/render/projected-balance-view-projected-balance-view-div1";
import { Landmark } from "lucide-react";
import Link from "next/link";

export function ProjectedBalanceViewDiv1({ hasProjectableAccounts, accounts, creditAccounts, filters, loadError, visibleProjection, selectedAccount, simulations, addSimulation, removeSimulation, clearSimulations }: ProjectedBalanceViewDiv1Props) {
  return (
<div className="space-y-6">
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
          <ProjectionFilters
            accounts={accounts}
            creditAccounts={creditAccounts}
            filters={filters}
          />

          {loadError ? (
            <ErrorPanel title="Filtros inválidos" message={loadError} />
          ) : visibleProjection ? (
            visibleProjection.daily.length ? (
              <>
                <ProjectionSummaryCards
                  summary={visibleProjection.summary}
                  selectedAccountName={selectedAccount?.name}
                />
                <ProjectionAlerts alerts={visibleProjection.summary.alerts} />
                <ProjectionSimulationPanel
                  accounts={accounts}
                  filters={filters}
                  simulations={simulations}
                  onAddSimulation={addSimulation}
                  onRemoveSimulation={removeSimulation}
                  onClearSimulations={clearSimulations}
                />
                <ProjectedBalanceChart
                  daily={visibleProjection.daily}
                  minimumReserveCents={visibleProjection.summary.minimumReserveCents}
                />
                <DailyProjectionExplorer
                  daily={visibleProjection.daily}
                  onRemoveSimulation={removeSimulation}
                />
              </>
            ) : (
              <FinanceEmptyState
                title="Projeção sem dias"
                description="Ajuste o período para visualizar a evolução diária do saldo."
              />
            )
          ) : (
            <FinanceEmptyState
              title="Saldo projetado indisponível"
              description="Ajuste os filtros ou confira se as contas possuem dados suficientes para a projeção."
            />
          )}
        </>
      )}
    </div>
  );
}
