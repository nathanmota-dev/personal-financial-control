"use client";

import { useMemo,useState } from "react";
import { ProjectedBalanceViewDiv1 } from "./projected-balance-view-projected-balance-view-div1";

import type { ProjectedBalanceViewProps } from "@/app/interfaces/projected-balance";
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
    <ProjectedBalanceViewDiv1 hasProjectableAccounts={hasProjectableAccounts} accounts={accounts} creditAccounts={creditAccounts} filters={filters} loadError={loadError} visibleProjection={visibleProjection} selectedAccount={selectedAccount} simulations={simulations} addSimulation={addSimulation} removeSimulation={removeSimulation} clearSimulations={clearSimulations} />
  );
}
