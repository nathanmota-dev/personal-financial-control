"use client";

import { usePathname, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
const FILTER_SELECT_TRIGGER_CLASSNAME =
  "h-10 w-full rounded-xl border-input bg-surface/80 pr-11 pl-4 text-left text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20 data-[state=open]:border-content-subtle data-[state=open]:bg-surface-raised";
const FILTER_SELECT_CONTENT_CLASSNAME =
  "rounded-[1.25rem] border-border bg-surface/96 p-1 text-content-strong shadow-[0_24px_80px_rgb(var(--surface-rgb) / .45)]";
const FILTER_SELECT_ITEM_CLASSNAME =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-content-strong focus:bg-surface-elevated focus:text-content-strong data-[state=checked]:bg-surface-elevated/90 data-[state=checked]:text-content-strong";

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
      <SelectTrigger className={FILTER_SELECT_TRIGGER_CLASSNAME}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={8}
        className={FILTER_SELECT_CONTENT_CLASSNAME}
      >
        <SelectItem value={EMPTY_FILTER_VALUE} className={FILTER_SELECT_ITEM_CLASSNAME}>
          {emptyLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={FILTER_SELECT_ITEM_CLASSNAME}>
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
    <Card className="rounded-[1.75rem] border-border bg-surface/75">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          <MonthPickerField
            month={filters.month}
            onMonthChange={(month) => updateFilters({ month })}
            className="w-full"
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
      </CardContent>
    </Card>
  );
}
