"use client";

import { ArchiveAccountButton } from "@/components/finance/archive-account-button";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { AccountSetupDialog } from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
accountTypeLabels,
formatCurrency
} from "@/lib/finance-ui";
import type { SettingsViewTabsContent1Props } from "@/lib/interfaces/render/settings-view-settings-view-tabs-content1";
import { Pencil } from "lucide-react";

export function SettingsViewTabsContent1({ accounts }: SettingsViewTabsContent1Props) {
  return (
<TabsContent value="accounts">
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.length ? (
              accounts.map((account) => (
                <Card key={account.id} className="rounded-xl border-border bg-card">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{account.name}</CardTitle>
                        <p className="mt-1 text-xs text-content-muted">{accountTypeLabels[account.type]}</p>
                      </div>
                      {account.isArchived ? <Badge variant="outline">Arquivada</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {account.type === "credit" ? (
                      <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                        <div className="min-w-0">
                          <p className="text-xs text-content-muted">Fechamento</p>
                          <p className="mt-1 font-semibold text-content-strong">
                            {account.creditClosingDay ? `Dia ${account.creditClosingDay}` : "Não configurado"}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-content-muted">Vencimento</p>
                          <p className="mt-1 font-semibold text-content-strong">
                            Dia {account.creditDueDay}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                        <div className="min-w-0">
                          <p className="text-xs text-content-muted">Saldo inicial</p>
                          <p className="mt-1 font-semibold text-content-strong">
                            {formatCurrency(account.initialBalanceCents)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-content-muted">Saldo atual</p>
                          <p className="mt-1 font-semibold text-content-strong">
                            {formatCurrency(account.currentBalanceCents)}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <AccountSetupDialog
                        account={account}
                        trigger={
                          <Button variant="outline" className="flex-1">
                            <Pencil className="size-4" />
                            Editar
                          </Button>
                        }
                      />
                      {!account.isArchived ? <ArchiveAccountButton id={account.id} /> : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <FinanceEmptyState
                title="Nenhuma conta cadastrada"
                description="Crie ao menos uma conta para destravar lançamentos, transferências e recorrências."
                action={<AccountSetupDialog />}
              />
            )}
          </div>
        </TabsContent>
  );
}
