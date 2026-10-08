"use client";

import { usePathname,useRouter } from "next/navigation";
import { useOptimistic,useState,useTransition } from "react";
import { CreditCardViewDiv1 } from "./credit-card-view-credit-card-view-div1";
import { CREDIT_CARD_COMMAND_ACTIONS } from "@/lib/finance-command-catalog";
import { useFinanceCommandIntent } from "@/hooks/finance/use-finance-command-intent";
import { toast } from "sonner";

import {
CreditCardMonthPicker
} from "@/components/finance/credit-card-page-actions";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import {
AccountSetupDialog
} from "@/components/finance/setup-dialogs";
import { buildCreditCardMonthPoints } from "@/lib/credit-card-view";
import type { CreditCardViewProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardView({ overview, categories, loadError = false }: CreditCardViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMonth, setSelectedMonth] = useOptimistic(overview.month);
  const [purchaseCommandId, setPurchaseCommandId] = useState<string | null>(null);
  const [setupCommandId, setSetupCommandId] = useState<string | null>(null);
  const [categoryCommandId, setCategoryCommandId] = useState<string | null>(null);
  const expenseCategories = categories.filter(
    (category) =>
      category.group === "fixed_expense" || category.group === "variable_expense"
  );

  useFinanceCommandIntent(CREDIT_CARD_COMMAND_ACTIONS, (intent) => {
    if (loadError) {
      toast.error("Não foi possível carregar os dados do cartão. Tente novamente.");
      return;
    }
    if (overview.state === "no_account") {
      setSetupCommandId(intent.id);
      return;
    }
    if (overview.state === "multiple_accounts") {
      toast.info("Mantenha um único cartão ativo para registrar uma compra.");
      return;
    }
    if (overview.needsConfiguration) {
      setSetupCommandId(intent.id);
      return;
    }
    if (!expenseCategories.length) {
      setCategoryCommandId(intent.id);
      return;
    }
    setPurchaseCommandId(intent.id);
  });

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
          action={
            <AccountSetupDialog
              commandId={setupCommandId}
              defaultType="credit"
            />
          }
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
        <div className="rounded-xl border border-warning/20 bg-warning/[0.06] p-6">
          <p className="text-xl font-semibold text-content-strong">Mais de um cartão ativo</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-content">
            Selecione ou arquive um cartão nas configurações para liberar o acompanhamento detalhado da fatura.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {overview.accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p data-user-content className="font-medium text-content-strong">{account.name}</p>
                <p className="mt-2 text-sm text-content">
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
    if (month === overview.month) {
      return;
    }

    const params = new URLSearchParams();
    params.set("month", month);
    startTransition(() => {
      setSelectedMonth(month);
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <CreditCardViewDiv1 overview={overview} expenseCategories={expenseCategories} canCreatePurchase={canCreatePurchase} monthPoints={monthPoints} selectedMonth={selectedMonth} selectMonth={selectMonth} isPending={isPending} purchaseCommandId={purchaseCommandId} setupCommandId={setupCommandId} categoryCommandId={categoryCommandId} />
  );
}
