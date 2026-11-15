"use client";

import { ArrowLeftRight, CreditCard, LayoutDashboard } from "lucide-react";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { IconTile } from "@/components/finance/ds/icon-tile";
import type { OnboardingSummaryStepProps } from "@/lib/interfaces/onboarding";
import { countLabel, ONBOARDING_NEXT_STEPS } from "@/lib/onboarding/steps";

const icons = [ArrowLeftRight, CreditCard, LayoutDashboard];

export function OnboardingSummaryStep({ bankAccounts, cards }: OnboardingSummaryStepProps) {
  const balance = bankAccounts.reduce((sum, account) => sum + account.initialBalanceCents, 0);
  return <div className="grid gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section aria-label="Resumo da configuração" className="min-w-0 rounded-[20px] border border-border p-5">
      <p className="text-[10px] font-bold tracking-wider text-content uppercase">Saldo inicial das contas</p>
      <DashboardCardsMoney cents={balance} className="mt-2 block text-[40px] leading-[44px] font-bold text-content-strong" />
      <p className="mt-2 text-xs text-content">{`${countLabel(bankAccounts.length, "conta", "contas")} e ${countLabel(cards.length, "cartão", "cartões")} prontos no Finance.`}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div><dt className="text-xs text-content-muted">Contas</dt><dd className="mt-1 text-xl font-semibold text-content-strong">{bankAccounts.length}</dd></div>
        <div><dt className="text-xs text-content-muted">Cartões</dt><dd className="mt-1 text-xl font-semibold text-content-strong">{cards.length}</dd></div>
      </dl>
    </section>
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-wider text-content uppercase">Próximos passos</p>
      <ol aria-label="Próximos passos" className="mt-2 divide-y divide-border">
        {ONBOARDING_NEXT_STEPS.map((item, index) => {
          const Icon = icons[index];
          return <li key={item.title} className="flex items-center gap-3 py-3">
            <IconTile tone="brand"><Icon /></IconTile>
            <div className="min-w-0"><p className="text-[13px] font-semibold text-content-strong">{item.title}</p><p className="text-xs text-content">{item.description}</p></div>
          </li>;
        })}
      </ol>
    </div>
  </div>;
}
