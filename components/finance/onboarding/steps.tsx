"use client";

import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { CreditCard, LayoutDashboard, Monitor, Moon, Sun, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { ChoiceGroup, Onboarding, TipsList } from "@/components/ui/onboarding";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { OnboardingStepsProps } from "@/lib/interfaces/onboarding";
import { OnboardingAccountForm } from "./account-form";

export function OnboardingSteps({ name, accounts, disabled, onSaved, onBusyChange }: OnboardingStepsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { theme, setTheme } = useTheme();
  const bankAccounts = accounts.filter(account => account.type !== "credit" && account.type !== "investment");
  const cards = accounts.filter(account => account.type === "credit");

  return <>
    <Onboarding.Step step={1} className="space-y-6">
      <Onboarding.Header title={`Boas-vindas, ${name.trim().split(/\s+/)[0]}!`} description="Vamos organizar seu Finance para acompanhar o dinheiro com clareza." />
      <div className="space-y-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-3"><Wallet className="size-5 shrink-0 text-brand" />Cadastre suas contas e registre receitas e despesas no dia a dia.</p>
        <p className="flex items-start gap-3"><CreditCard className="size-5 shrink-0 text-brand" />Adicione cartões para acompanhar compras e faturas.</p>
        <p className="flex items-start gap-3"><LayoutDashboard className="size-5 shrink-0 text-brand" />Consulte o Dashboard para entender seus saldos e gastos.</p>
      </div>
      <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-strong">Contas e cartões são opcionais. Você pode cadastrá-los depois em Configurações.</p>
    </Onboarding.Step>
    <Onboarding.Step step={2} className="space-y-6">
      <Onboarding.Header title="Do seu jeito" description="Escolha a aparência mais confortável para você." />
      <ChoiceGroup name="Aparência" value={theme ?? "system"} onValueChange={setTheme} className="grid grid-cols-3 gap-3">
        {[{ value: "light", label: "Claro", Icon: Sun }, { value: "dark", label: "Escuro", Icon: Moon }, { value: "system", label: "Sistema", Icon: Monitor }].map(({ value, label, Icon }) =>
          <ChoiceGroup.Item key={value} value={value} className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-4 text-sm data-[state=selected]:border-brand data-[state=selected]:bg-brand-soft data-[state=selected]:text-brand-strong has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
            <Icon className="size-6" />{label}
          </ChoiceGroup.Item>)}
      </ChoiceGroup>
      <p className="text-sm text-muted-foreground">Sistema acompanha o tema do seu dispositivo.</p>
    </Onboarding.Step>
    {[{ step: 3, credit: false, title: "Suas contas", description: "Adicione onde você guarda e movimenta seu dinheiro.", items: bankAccounts },
      { step: 4, credit: true, title: "Seus cartões", description: "Informe os dias da fatura para acompanhar cada cartão.", items: cards }].map(({ step, credit, title, description, items }) =>
      <Onboarding.Step key={step} step={step} className="space-y-5">
        <Onboarding.Header title={title} description={description} />
        <FinancialPrivacyForm><OnboardingAccountForm credit={credit} onSaved={onSaved} onBusyChange={onBusyChange} disabled={disabled} /></FinancialPrivacyForm>
        <div aria-live="polite" className="space-y-2">
          <p className="text-sm font-medium">{credit ? "Cartões" : "Contas"} cadastrados ({items.length})</p>
          {items.length ? <ul className="divide-y rounded-lg border px-3">{items.map(account => <li key={account.id} className="flex justify-between gap-3 py-3 text-sm">
            <span className="min-w-0 break-words">{account.name}</span><span className="shrink-0 text-muted-foreground">{credit ? `Fecha ${account.creditClosingDay ?? "—"} · Vence ${account.creditDueDay}` : formatCurrency(account.initialBalanceCents)}</span>
          </li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum cadastro ainda. Você pode pular esta etapa.</p>}
        </div>
      </Onboarding.Step>)}
    <Onboarding.Step step={5} className="space-y-6">
      <Onboarding.Header title="Tudo pronto!" description="Seu próximo passo é acompanhar suas finanças." />
      <p className="rounded-lg bg-brand-soft p-4 text-sm text-brand-strong">{bankAccounts.length} conta(s) e {cards.length} cartão(ões) disponíveis no Finance.</p>
      <TipsList title="Próximos passos" className="[&_ol]:space-y-4">
        <TipsList.Item>Registre receitas e despesas em Lançamentos.</TipsList.Item>
        <TipsList.Item>Acompanhe as compras e o vencimento das faturas em Cartão.</TipsList.Item>
        <TipsList.Item>Consulte o Dashboard para ver saldos, gastos e evolução mensal.</TipsList.Item>
      </TipsList>
    </Onboarding.Step>
  </>;
}
