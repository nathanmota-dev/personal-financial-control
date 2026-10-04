"use client";
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
import { financeIconClassName } from "@/components/finance/finance-styles";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import {
centsToMoneyInput
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";


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
    <Card className="rounded-[20px] border-border bg-card">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(financeIconClassName, "bg-brand/10 text-brand")}>
            <SlidersHorizontal className="size-4" />
          </div>
          <CardTitle>Filtros da projeção</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
