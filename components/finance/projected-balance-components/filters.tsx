"use client";

import { ProjectionFiltersApplyReserve } from "@/lib/utils/component-actions/filters-apply-reserve";
import { ProjectionFiltersUpdateFilters } from "@/lib/utils/component-actions/filters-update-filters";
import { ProjectionFiltersDiv3 } from "./filters-projection-filters-div3";
import { ToggleFilter } from "./toggle-filter";

import { usePathname,useRouter } from "next/navigation";
import { useState,useTransition } from "react";

import type {
ProjectionFiltersProps
} from "@/app/interfaces/projected-balance";
import {
centsToMoneyInput
} from "@/lib/finance-ui";


export function ProjectionFilters({
  accounts,
  creditAccounts,
  filters,
}: ProjectionFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [reserveInput, setReserveInput] = useState(
    centsToMoneyInput(filters.minimumReserveCents)
  );
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedAccountId = filters.accountId;
  const creditDisabled = Boolean(selectedAccountId) || creditAccounts.length === 0;
  const creditChecked = !creditDisabled && filters.includeCreditCard;

  function updateFilters(next: Partial<typeof filters>) {
    return ProjectionFiltersUpdateFilters({ filters, startTransition, router, pathname }, next);
  }

  function applyReserve() {
    return ProjectionFiltersApplyReserve({ updateFilters, reserveInput, setReserveInput, filters });
  }

  return (
    <section aria-label="Filtros da projeção" className="@container min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <h2 className="text-lg font-semibold leading-[25px]">Filtros da projeção</h2>
      <p className="mt-1 text-xs text-content-muted">Período, conta e o que entra no cálculo</p>
      <div className="mt-5 space-y-5">
        <ProjectionFiltersDiv3 filters={filters} updateFilters={updateFilters} isStartDatePickerOpen={isStartDatePickerOpen} setIsStartDatePickerOpen={setIsStartDatePickerOpen} accounts={accounts} reserveInput={reserveInput} setReserveInput={setReserveInput} applyReserve={applyReserve} isPending={isPending} />

        <div>
          <p className="text-[10px] font-bold tracking-wider text-content uppercase">Entra no cálculo</p>
          <div className="mt-2 divide-y divide-border">
            <ToggleFilter
              label="Investimentos"
              description="Aportes previstos"
              checked={filters.includeInvestments}
              onCheckedChange={(checked) =>
                updateFilters({ includeInvestments: checked })
              }
            />
            <ToggleFilter
              label="Cartão"
              description={
                selectedAccountId
                  ? "Disponível apenas no consolidado"
                  : `${creditAccounts.length} cartão(ões)`
              }
              checked={creditChecked}
              disabled={creditDisabled}
              onCheckedChange={(checked) => updateFilters({ includeCreditCard: checked })}
            />
            <ToggleFilter
              label="Transferências"
              description="Entradas e saídas entre contas"
              checked={filters.includeTransfers}
              onCheckedChange={(checked) => updateFilters({ includeTransfers: checked })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
