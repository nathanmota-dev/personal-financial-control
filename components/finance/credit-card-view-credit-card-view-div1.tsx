"use client";

import { CreditCardCommitments } from "@/components/finance/credit-card-commitments";
import { CreditCardInvoiceSummary } from "@/components/finance/credit-card-invoice-summary";
import { CreditCardsShowcase } from "@/components/finance/credit-cards-showcase";
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

export function CreditCardViewDiv1({ overview, expenseCategories, canCreatePurchase, monthPoints, selectedMonth, selectMonth, cards, selectedCardId, selectCard, isPending, purchaseCommandId, setupCommandId, categoryCommandId }: CreditCardViewDiv1Props) {
  return (
<div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Cartões"
        title="Cartões"
        description="Faturas, compras e parcelas de cada cartão em um só lugar."
        actions={
          <CreditCardPageActions
            month={overview.month}
            accountId={overview.account.id}
            categories={expenseCategories}
            canCreatePurchase={canCreatePurchase}
            purchaseCommandId={purchaseCommandId}
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
              commandId={setupCommandId}
              defaultType="credit"
              trigger={<Button>Editar cartão</Button>}
            />
          }
        />
      ) : null}

      {!expenseCategories.length ? (
        <CreditCardSetupCard
          title="Cadastre categorias de despesa"
          description="As compras do cartão usam categorias de gasto fixo ou variável para organizar o extrato."
          action={<CategorySetupDialog commandId={categoryCommandId} />}
        />
      ) : null}

      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
        {cards.length ? <CreditCardsShowcase cards={cards} selectedId={selectedCardId} month={selectedMonth} onSelect={selectCard} /> : null}
        <div className="grid min-w-0 content-start gap-6 min-[100.0625rem]:gap-5">
          <CreditCardInvoiceSummary overview={overview} nextInvoice={monthPoints.find((point) => point.month > overview.month)} />
          <CreditCardCommitments overview={overview} />
        </div>
      </div>

      <CreditCardMonthStrip
        key={overview.month}
        points={monthPoints}
        selectedMonth={selectedMonth}
        onSelectMonth={selectMonth}
        isLoading={isPending}
      />

      {isPending ? <CreditCardMonthLoading month={selectedMonth} /> : (
        <CreditCardTransactionsPanel
          accountId={overview.account.id}
          categories={expenseCategories}
          month={overview.month}
          entries={overview.invoice.entries}
          categoryTotals={overview.invoice.categoryTotals}
        />
      )}
    </div>
  );
}
