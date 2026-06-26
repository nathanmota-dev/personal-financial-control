"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";

import type { ProjectedBalanceViewProps } from "@/app/interfaces/projected-balance";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ErrorPanel } from "@/components/finance/error-panel";
import { PageHeader } from "@/components/finance/page-header";
import { ProjectedBalanceChart } from "@/components/finance/projected-balance-components/chart";
import { DailyProjectionTable } from "@/components/finance/projected-balance-components/daily-projection-table";
import { ProjectionFilters } from "@/components/finance/projected-balance-components/filters";
import {
  ProjectionAlerts,
  ProjectionSummaryCards,
} from "@/components/finance/projected-balance-components/summary";
import { Button } from "@/components/ui/button";

export function ProjectedBalanceView({
  projection,
  accounts,
  creditAccounts,
  filters,
  loadError,
}: ProjectedBalanceViewProps) {
  const selectedAccount = accounts.find((account) => account.id === filters.accountId);
  const hasProjectableAccounts = accounts.length > 0;

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
          ) : projection ? (
            projection.daily.length ? (
              <>
                <ProjectionSummaryCards
                  summary={projection.summary}
                  selectedAccountName={selectedAccount?.name}
                />
                <ProjectionAlerts alerts={projection.summary.alerts} />
                <ProjectedBalanceChart
                  daily={projection.daily}
                  minimumReserveCents={projection.summary.minimumReserveCents}
                />
                <DailyProjectionTable daily={projection.daily} />
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
