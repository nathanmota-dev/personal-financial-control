"use client";

import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { MoneyInput } from "@/components/finance/money-input";
import { FilterField } from "@/components/finance/projected-balance-components/filter-field";
import { ProjectionFiltersFilterField1 } from "@/components/finance/projected-balance-components/filters-projection-filters-filter-field1";
import { ProjectionFiltersFilterField2 } from "@/components/finance/projected-balance-components/filters-projection-filters-filter-field2";
import { periodLabels } from "@/components/finance/projected-balance-components/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { ProjectedBalancePeriod } from "@/lib/interfaces/projected-balance";
import type { ProjectionFiltersDiv3Props } from "@/lib/interfaces/render/filters-projection-filters-div3";
import { cn } from "@/lib/utils";
import { filterInputClassName,filterSelectContentClassName,filterSelectItemClassName,filterSelectTriggerClassName } from "@/lib/utils/components/filters";
import { Check } from "lucide-react";

export function ProjectionFiltersDiv3({ filters, updateFilters, isStartDatePickerOpen, setIsStartDatePickerOpen, accounts, reserveInput, setReserveInput, applyReserve, isPending }: ProjectionFiltersDiv3Props) {
  return (
<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterField label="Período">
            <Select
              value={filters.period}
              onValueChange={(period) =>
                updateFilters({ period: period as ProjectedBalancePeriod })
              }
            >
              <SelectTrigger className={filterSelectTriggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={filterSelectContentClassName}>
                {Object.entries(periodLabels).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className={filterSelectItemClassName}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <ProjectionFiltersFilterField1 isStartDatePickerOpen={isStartDatePickerOpen} setIsStartDatePickerOpen={setIsStartDatePickerOpen} filters={filters} updateFilters={updateFilters} />

          {filters.period === "custom" ? (
            <FilterField label="Data final">
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilters({ endDate: event.target.value })}
                className={filterInputClassName}
              />
            </FilterField>
          ) : null}

          <ProjectionFiltersFilterField2 filters={filters} updateFilters={updateFilters} accounts={accounts} />

          <FilterField label="Reserva mínima"><FinancialPrivacyForm>
            <div className="flex gap-2">
              <MoneyInput
                inputMode="decimal"
                value={reserveInput}
                onChange={(event) => setReserveInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyReserve();
                  }
                }}
                className={cn(filterInputClassName, "tabular-nums")}
                placeholder="0,00"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={applyReserve}
                disabled={isPending}
                aria-label="Aplicar reserva mínima"
                className="h-10 border-input bg-card text-content-strong hover:bg-surface-raised"
              >
                <Check className="size-4" />
              </Button>
            </div>
          </FinancialPrivacyForm></FilterField>
        </div>
  );
}
