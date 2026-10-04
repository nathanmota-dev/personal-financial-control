"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import {
SetupCallout
} from "@/components/finance/setup-dialogs";
import { TransferDialog } from "@/components/finance/transaction-actions";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
formatCurrency,
formatDateLabel
} from "@/lib/finance-ui";
import type { TransactionsViewTabsContent3Props } from "@/lib/interfaces/render/transactions-view-transactions-view-tabs-content3";

export function TransactionsViewTabsContent3({ transfers, accounts, filters }: TransactionsViewTabsContent3Props) {
  return (
<TabsContent value="transfers">
          <Card className="rounded-xl border-border bg-card">
            <CardHeader>
              <CardTitle>Transferências do mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transfers.length ? (
                transfers.map((transfer) => (
                  <div key={transfer.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-medium text-content-strong">{transfer.description}</p>
                      <p className="text-sm text-content">
                        {formatDateLabel(transfer.transferDate)} • {transfer.fromAccount?.name ?? "-"} para {transfer.toAccount?.name ?? "-"}
                      </p>
                    </div>
                    <p className="font-semibold text-brand">{formatCurrency(transfer.amountCents)}</p>
                  </div>
                ))
              ) : (
                <FinanceEmptyState
                  title="Sem transferências"
                  description="Transferências exigem pelo menos duas contas cadastradas."
                  action={
                    accounts.length >= 2 ? (
                      <TransferDialog accounts={accounts} month={filters.month} />
                    ) : (
                      <SetupCallout title="Cadastre duas contas" description="Crie pelo menos duas contas para movimentar saldo entre origem e destino." />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
  );
}
