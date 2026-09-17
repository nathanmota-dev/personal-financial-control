"use client";

import { usePathname, useRouter } from "next/navigation";

import { CreditCardCommitments } from "@/components/finance/credit-card-commitments";
import { CreditCardHero } from "@/components/finance/credit-card-hero";
import {
  CreditCardMonthPicker,
  CreditCardPageActions,
} from "@/components/finance/credit-card-page-actions";
import { CreditCardMonthStrip } from "@/components/finance/credit-card-month-strip";
import { CreditCardSetupCard } from "@/components/finance/credit-card-setup-card";
import { CreditCardTransactionsPanel } from "@/components/finance/credit-card-transactions-panel";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import {
  AccountSetupDialog,
  CategorySetupDialog,
} from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { buildCreditCardMonthPoints } from "@/lib/credit-card-view";
import type { CreditCardViewProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardView({ overview, categories }: CreditCardViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const expenseCategories = categories.filter(
    (category) =>
      category.group === "fixed_expense" || category.group === "variable_expense"
  );

  if (overview.state === "no_account") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cartão de crédito"
          title={`Sua fatura em ${overview.month}`}
          description="Cadastre um cartão para acompanhar faturas, compras e parcelas futuras em uma visão dedicada."
          actions={<CreditCardMonthPicker month={overview.month} />}
        />
        <FinanceEmptyState
          title="Nenhum cartão configurado"
          description="Cadastre uma conta do tipo cartão para começar a acompanhar suas faturas."
          action={<AccountSetupDialog />}
        />
      </div>
    );
  }

  if (overview.state === "multiple_accounts") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cartão de crédito"
          title={`Seus cartões em ${overview.month}`}
          description="A visão detalhada precisa de um único cartão ativo para organizar o ciclo e as parcelas."
          actions={<CreditCardMonthPicker month={overview.month} />}
        />
        <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/[0.06] p-6">
          <p className="font-heading text-xl font-semibold text-slate-100">Mais de um cartão ativo</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Selecione ou arquive um cartão nas configurações para liberar o acompanhamento detalhado da fatura.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="font-medium text-slate-100">{account.name}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Fecha dia {account.creditClosingDay ?? "—"} · vence dia {account.creditDueDay}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const monthPoints = buildCreditCardMonthPoints(overview);
  const canCreatePurchase = expenseCategories.length > 0 && !overview.needsConfiguration;

  function selectMonth(month: string) {
    const params = new URLSearchParams();
    params.set("month", month);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Cartão de crédito"
        title={overview.account.name}
        description="Fatura, evolução mensal e parcelas futuras em um só lugar."
        className="border-slate-800/90 bg-[#0d1523]/90 shadow-[0_24px_80px_rgba(2,6,23,0.32)]"
        actions={
          <CreditCardPageActions
            month={overview.month}
            accountId={overview.account.id}
            categories={expenseCategories}
            canCreatePurchase={canCreatePurchase}
          />
        }
      />

      {overview.needsConfiguration ? (
        <CreditCardSetupCard
          title="Configure o fechamento do cartão"
          description="Defina o dia de fechamento para distribuir automaticamente as compras entre as faturas corretas."
          action={
            <AccountSetupDialog
              account={overview.account}
              trigger={<Button>Editar cartão</Button>}
            />
          }
        />
      ) : null}

      {!expenseCategories.length ? (
        <CreditCardSetupCard
          title="Cadastre categorias de despesa"
          description="As compras do cartão usam categorias de gasto fixo ou variável para organizar o extrato."
          action={<CategorySetupDialog />}
        />
      ) : null}

      <CreditCardHero overview={overview} nextInvoice={monthPoints[1]} />

      <CreditCardMonthStrip
        key={overview.month}
        points={monthPoints}
        selectedMonth={overview.month}
        onSelectMonth={selectMonth}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <CreditCardTransactionsPanel
          accountId={overview.account.id}
          categories={expenseCategories}
          month={overview.month}
          entries={overview.invoice.entries}
          categoryTotals={overview.invoice.categoryTotals}
        />
        <CreditCardCommitments overview={overview} monthPoints={monthPoints} />
      </div>
    </div>
  );
}
