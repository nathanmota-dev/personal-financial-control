"use client";

import { IconTile } from "@/components/finance/ds/icon-tile";
import { ProjectionFiltersApplyReserve } from "@/lib/utils/component-actions/filters-apply-reserve";
import { ProjectionFiltersUpdateFilters } from "@/lib/utils/component-actions/filters-update-filters";
import { ProjectionFiltersDiv3 } from "./filters-projection-filters-div3";
import { ToggleFilter } from "./toggle-filter";

import { SlidersHorizontal } from "lucide-react";
import { usePathname,useRouter } from "next/navigation";
import { useState,useTransition } from "react";

import type {
ProjectionFiltersProps
} from "@/app/interfaces/projected-balance";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
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
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <IconTile tone="brand" size="sm"><SlidersHorizontal /></IconTile>
        <div>
          <CardTitle className="text-base">Filtros da projeção</CardTitle>
          <p className="text-xs text-content-muted">Período, conta e o que entra no cálculo.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5 sm:px-6">
        <ProjectionFiltersDiv3 filters={filters} updateFilters={updateFilters} isStartDatePickerOpen={isStartDatePickerOpen} setIsStartDatePickerOpen={setIsStartDatePickerOpen} accounts={accounts} reserveInput={reserveInput} setReserveInput={setReserveInput} applyReserve={applyReserve} isPending={isPending} />

        <div className="grid gap-3 md:grid-cols-3">
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
      </CardContent>
    </Card>
  );
}
