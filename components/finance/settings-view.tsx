"use client";

import { CreditCard, KeyRound, Landmark, Link2, ShieldCheck, Tags, Wallet } from "lucide-react";

import { McpTokenSettings } from "@/components/auth/mcp-token-settings";
import { SecuritySettings } from "@/components/auth/security-settings";
import { OpenFinanceSettings } from "@/components/finance/open-finance/open-finance-settings";
import { PageHeader } from "@/components/finance/page-header";
import { SettingsAccountsPanel } from "@/components/finance/settings/settings-accounts-panel";
import { SettingsCardsPanel } from "@/components/finance/settings/settings-cards-panel";
import { SettingsCategoriesPanel } from "@/components/finance/settings/settings-categories-panel";
import { SettingsReservePanel } from "@/components/finance/settings/settings-reserve-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsViewProps } from "@/lib/interfaces/components/settings-view";

export function SettingsView({
  accounts,
  categories,
  security,
  openFinance,
  reserveProjection = null,
  initialTab = "accounts",
}: SettingsViewProps) {
  const moneyAccounts = accounts.filter((account) => account.type === "checking" || account.type === "savings" || account.type === "cash");
  const cards = accounts.filter((account) => account.type === "credit");
  const investmentAccounts = accounts.filter((account) => account.type === "investment");

  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        title="Configurações"
        description="Gerencie suas contas, cartões, investimentos, categorias, segurança e integrações do app."
      />

      <Tabs defaultValue={initialTab} className="gap-5">
        <TabsList aria-label="Seções das configurações" variant="line" className="max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="accounts" className="shrink-0 px-3"><Wallet />Contas</TabsTrigger>
          <TabsTrigger value="cards" className="shrink-0 px-3"><CreditCard />Cartões</TabsTrigger>
          <TabsTrigger value="investments" className="shrink-0 px-3"><Landmark />Investimentos</TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0 px-3"><Tags />Categorias</TabsTrigger>
          {openFinance ? <TabsTrigger value="open-finance" className="shrink-0 px-3"><Link2 />Open Finance</TabsTrigger> : null}
          {security ? <TabsTrigger value="security" className="shrink-0 px-3"><ShieldCheck />Segurança</TabsTrigger> : null}
          {security ? <TabsTrigger value="mcp" className="shrink-0 px-3"><KeyRound />MCP</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="accounts" className="mt-0">
          <SettingsAccountsPanel
            title="Contas"
            description="Saldo atual somado das contas ativas: conta corrente, poupança e dinheiro."
            emptyTitle="Nenhuma conta cadastrada"
            emptyDescription="Crie ao menos uma conta para destravar lançamentos, transferências e recorrências."
            newLabel="Nova conta"
            illustrationSrc="/images/balance-wallet.webp"
            accounts={moneyAccounts}
            allowedTypes={["checking", "savings", "cash"]}
          />
        </TabsContent>

        <TabsContent value="cards" className="mt-0">
          <SettingsCardsPanel cards={cards} />
        </TabsContent>

        <TabsContent value="investments" className="mt-0 grid items-start gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
          <SettingsAccountsPanel
            title="Contas de investimento"
            description="Saldo atual somado das contas usadas para aportes e resgates."
            emptyTitle="Nenhuma conta de investimento"
            emptyDescription="Cadastre a corretora ou banco onde ficam seus investimentos para registrar aportes e resgates."
            newLabel="Nova conta de investimento"
            illustrationSrc="/images/investments-chart.webp"
            accounts={investmentAccounts}
            allowedTypes={["investment"]}
          />
          <SettingsReservePanel projection={reserveProjection} />
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <SettingsCategoriesPanel categories={categories} />
        </TabsContent>

        {openFinance ? (
          <TabsContent value="open-finance" className="mt-0">
            <OpenFinanceSettings configured={openFinance.configured} accounts={accounts} categories={categories} />
          </TabsContent>
        ) : null}

        {security ? (
          <TabsContent value="security" className="mt-0">
            <SecuritySettings lockTimeoutMinutes={security.lockTimeoutMinutes} lockOnClose={security.lockOnClose} />
          </TabsContent>
        ) : null}

        {security ? (
          <TabsContent value="mcp" className="mt-0">
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <McpTokenSettings hasMcpToken={security.hasMcpToken} />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
