"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

import type {
  FilterFieldProps,
  ProjectionFiltersProps,
  ToggleFilterProps,
} from "@/app/interfaces/projected-balance";
import { financeIconClassName } from "@/components/finance/finance-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  accountTypeLabels,
  centsToMoneyInput,
  moneyInputToCents,
} from "@/lib/finance-ui";
import type { ProjectedBalancePeriod } from "@/lib/interfaces/projected-balance";
import { cn } from "@/lib/utils";

import { EMPTY_FILTER_VALUE, periodLabels } from "./labels";

const filterInputClassName =
  "h-10 rounded-xl border-slate-700 bg-slate-950/80 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] focus-visible:border-sky-400/70 focus-visible:ring-sky-400/20";
const filterSelectTriggerClassName =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/80 pr-11 pl-4 text-left text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] hover:bg-slate-900/90 focus-visible:border-sky-400/70 focus-visible:ring-sky-400/20 data-[state=open]:border-slate-600 data-[state=open]:bg-slate-900";
const filterSelectContentClassName =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";
const filterSelectItemClassName =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90 data-[state=checked]:text-slate-50";

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
  const [isPending, startTransition] = useTransition();
  const selectedAccountId = filters.accountId;
  const creditDisabled = Boolean(selectedAccountId) || creditAccounts.length === 0;
  const creditChecked = !creditDisabled && filters.includeCreditCard;

  function updateFilters(next: Partial<typeof filters>) {
    const merged = {
      ...filters,
      ...next,
    };

    if (merged.accountId) {
      merged.includeCreditCard = false;
    }

    const params = new URLSearchParams();
    params.set("period", merged.period);
    params.set("startDate", merged.startDate);

    if (merged.period === "custom") {
      params.set("endDate", merged.endDate);
    }

    if (merged.accountId) {
      params.set("accountId", merged.accountId);
    }

    if (merged.minimumReserveCents > 0) {
      params.set("minimumReserveCents", String(merged.minimumReserveCents));
    }

    if (!merged.includeCreditCard) {
      params.set("includeCreditCard", "false");
    }

    if (!merged.includeInvestments) {
      params.set("includeInvestments", "false");
    }

    if (!merged.includeTransfers) {
      params.set("includeTransfers", "false");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function applyReserve() {
    try {
      updateFilters({
        minimumReserveCents: moneyInputToCents(reserveInput || "0"),
      });
    } catch {
      setReserveInput(centsToMoneyInput(filters.minimumReserveCents));
    }
  }

  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(financeIconClassName, "bg-cyan-400/10 text-cyan-300")}>
            <SlidersHorizontal className="size-4" />
          </div>
          <CardTitle>Filtros da projeção</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

          <FilterField label="Data inicial">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilters({ startDate: event.target.value })}
              className={filterInputClassName}
            />
          </FilterField>

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

          <FilterField label="Reserva mínima">
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                value={reserveInput}
                onChange={(event) => setReserveInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyReserve();
                  }
                }}
                className={cn(filterInputClassName, "font-mono")}
                placeholder="0,00"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={applyReserve}
                disabled={isPending}
                aria-label="Aplicar reserva mínima"
                className="h-10 border-slate-700 bg-slate-950/80 text-slate-100 hover:bg-slate-900"
              >
                <Check className="size-4" />
              </Button>
            </div>
          </FilterField>
        </div>

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

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleFilter({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleFilterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4",
        disabled && "opacity-60"
      )}
    >
      <div>
        <p className="font-medium text-slate-100">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="data-checked:bg-cyan-300"
      />
    </div>
  );
}
