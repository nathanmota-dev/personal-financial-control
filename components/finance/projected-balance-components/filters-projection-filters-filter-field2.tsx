"use client";

import { FilterField } from "@/components/finance/projected-balance-components/filter-field";
import { EMPTY_FILTER_VALUE } from "@/components/finance/projected-balance-components/labels";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import {
accountTypeLabels
} from "@/lib/finance-ui";
import type { ProjectionFiltersFilterField2Props } from "@/lib/interfaces/render/filters-projection-filters-filter-field2";
import { filterSelectContentClassName,filterSelectItemClassName,filterSelectTriggerClassName } from "@/lib/utils/components/filters";

export function ProjectionFiltersFilterField2({ filters, updateFilters, accounts }: ProjectionFiltersFilterField2Props) {
  return (
<FilterField label="Conta">
            <Select
              value={filters.accountId ?? EMPTY_FILTER_VALUE}
              onValueChange={(accountId) =>
                updateFilters({
                  accountId:
                    accountId === EMPTY_FILTER_VALUE ? undefined : accountId,
                })
              }
            >
              <SelectTrigger className={filterSelectTriggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={filterSelectContentClassName}>
                <SelectItem
                  value={EMPTY_FILTER_VALUE}
                  className={filterSelectItemClassName}
                >
                  Todas as contas
                </SelectItem>
                {accounts.map((account) => (
                  <SelectItem
                    key={account.id}
                    value={account.id}
                    className={filterSelectItemClassName}
                  >
                    {account.name} · {accountTypeLabels[account.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
  );
}
