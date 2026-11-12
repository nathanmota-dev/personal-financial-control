"use client";

import { usePathname,useRouter } from "next/navigation";

import { MonthPickerField } from "@/components/ui/month-picker-field";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type {
FilterSelectProps,
TransactionFiltersProps,
} from "@/lib/interfaces/transactions";

const EMPTY_FILTER_VALUE = "__empty-filter__";
export const UNCATEGORIZED_FILTER_VALUE = "__uncategorized-filter__";
export function FilterSelect({
  value,
  emptyLabel,
  options,
  onValueChange,
}: FilterSelectProps) {
  return (
    <Select
      value={value || EMPTY_FILTER_VALUE}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === EMPTY_FILTER_VALUE ? undefined : nextValue)
      }
    >
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectItem value={EMPTY_FILTER_VALUE}>
          {emptyLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TransactionFilters({ accounts, categories, filters }: TransactionFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();

  function updateFilters(next: Partial<TransactionFiltersProps["filters"]>) {
    const merged = {
      month: filters.month,
      accountId: filters.accountId ?? "",
      categoryId: filters.categoryId ?? "",
      uncategorized: filters.uncategorized ?? false,
      status: filters.status ?? "",
      type: filters.type ?? "",
      section: filters.section ?? "transactions",
      ...next,
    };
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(merged)) {
      const normalizedValue = String(value ?? "");
      if (normalizedValue && normalizedValue !== "false") {
        params.set(key, normalizedValue);
      }
    }

    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  const categoryFilterValue = filters.uncategorized
    ? UNCATEGORIZED_FILTER_VALUE
    : filters.categoryId;

  return (
        <div role="group" aria-label="Filtros" className="flex flex-wrap items-center gap-3 border-b border-border px-[22px] pt-5 pb-5">
          <MonthPickerField
            month={filters.month}
            onMonthChange={(month) => updateFilters({ month })}
            className="w-full sm:w-[188px]"
          />
          <FilterSelect
            value={filters.type}
            emptyLabel="Todos os tipos"
            options={[
              { value: "income", label: "Receita" },
              { value: "expense", label: "Despesa" },
              { value: "investment_contribution", label: "Aporte" },
              { value: "investment_withdrawal", label: "Resgate" },
            ]}
            onValueChange={(type) => updateFilters({ type })}
          />
          <FilterSelect
            value={filters.accountId}
            emptyLabel="Todas as contas"
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            onValueChange={(accountId) => updateFilters({ accountId })}
          />
          <FilterSelect
            value={categoryFilterValue}
            emptyLabel="Todas as categorias"
            options={[
              { value: UNCATEGORIZED_FILTER_VALUE, label: "Sem categoria" },
              ...categories.map((category) => ({ value: category.id, label: category.name })),
            ]}
            onValueChange={(categoryId) =>
              updateFilters(
                categoryId === UNCATEGORIZED_FILTER_VALUE
                  ? { categoryId: undefined, uncategorized: true }
                  : { categoryId, uncategorized: false }
              )
            }
          />
          <FilterSelect
            value={filters.status}
            emptyLabel="Todos os status"
            options={[
              { value: "pending", label: "Pendente" },
              { value: "posted", label: "Lançado" },
              { value: "cancelled", label: "Cancelado" },
            ]}
            onValueChange={(status) => updateFilters({ status })}
          />
        </div>
  );
}
