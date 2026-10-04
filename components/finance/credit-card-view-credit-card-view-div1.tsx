"use client";

import { CreditCardCommitments } from "@/components/finance/credit-card-commitments";
import { CreditCardHero } from "@/components/finance/credit-card-hero";
import { CreditCardMonthLoading } from "@/components/finance/credit-card-month-loading";
import { CreditCardMonthStrip } from "@/components/finance/credit-card-month-strip";
import {
CreditCardPageActions
} from "@/components/finance/credit-card-page-actions";
import { CreditCardSetupCard } from "@/components/finance/credit-card-setup-card";
import { CreditCardTransactionsPanel } from "@/components/finance/credit-card-transactions-panel";
import { PageHeader } from "@/components/finance/page-header";
import {
AccountSetupDialog,
CategorySetupDialog,
} from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import type { CreditCardViewDiv1Props } from "@/lib/interfaces/render/credit-card-view-credit-card-view-div1";

export function CreditCardViewDiv1({ overview, expenseCategories, canCreatePurchase, monthPoints, selectedMonth, selectMonth, isPending }: CreditCardViewDiv1Props) {
  return (
<div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Cartão de crédito"
        title={overview.account.name}
        description="Fatura, evolução mensal e parcelas futuras em um só lugar."
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

      <CreditCardMonthStrip
        key={overview.month}
        points={monthPoints}
        selectedMonth={selectedMonth}
        onSelectMonth={selectMonth}
        isLoading={isPending}
      />

      {isPending ? (
        <CreditCardMonthLoading month={selectedMonth} />
      ) : (
        <>
          <CreditCardHero overview={overview} nextInvoice={monthPoints[1]} />

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
        </>
      )}
    </div>
  );
}
