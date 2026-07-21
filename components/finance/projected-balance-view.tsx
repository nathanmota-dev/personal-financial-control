"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

import type { ProjectedBalanceViewProps } from "@/app/interfaces/projected-balance";
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
import type { ProjectionSimulation } from "@/lib/interfaces/projected-balance";
import { recalculateProjectionWithSimulations } from "@/lib/projected-balance";

export function ProjectedBalanceView({
  projection,
  accounts,
  creditAccounts,
  filters,
  loadError,
}: ProjectedBalanceViewProps) {
  const [simulations, setSimulations] = useState<ProjectionSimulation[]>([]);
  const selectedAccount = accounts.find((account) => account.id === filters.accountId);
  const hasProjectableAccounts = accounts.length > 0;
  const visibleProjection = useMemo(() => {
    if (!projection) {
      return null;
    }

    const applicableSimulations = simulations.filter(
      (simulation) => !filters.accountId || simulation.accountId === filters.accountId
    );

    return recalculateProjectionWithSimulations(projection, applicableSimulations);
  }, [filters.accountId, projection, simulations]);

  function addSimulation(simulation: ProjectionSimulation) {
    setSimulations((current) => [...current, simulation]);
  }

  function removeSimulation(simulationId: string) {
    setSimulations((current) =>
      current.filter((simulation) => simulation.id !== simulationId)
    );
  }

  function clearSimulations() {
    setSimulations([]);
  }

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
