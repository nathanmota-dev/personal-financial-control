"use client";

import type { CategoryRow,SettingsViewProps } from "@/lib/interfaces/components/settings-view";
import { useMemo } from "react";
import { SettingsViewTabsContent1 } from "./settings-view-settings-view-tabs-content1";
import { SettingsViewTabsContent2 } from "./settings-view-settings-view-tabs-content2";

import { McpTokenSettings } from "@/components/auth/mcp-token-settings";
import { SecuritySettings } from "@/components/auth/security-settings";
import { PageHeader } from "@/components/finance/page-header";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";

export function SettingsView({
  accounts,
  categories,
  security,
}: SettingsViewProps) {
  const categoriesByGroup = useMemo(
    () =>
      categories.reduce<Record<string, CategoryRow[]>>((accumulator, category) => {
        accumulator[category.group] ??= [];
        accumulator[category.group].push(category);
        return accumulator;
      }, {}),
    [categories]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie suas contas, categorias, segurança e integrações do app."
      />

      <Tabs defaultValue="accounts">
        <TabsList aria-label="Seções das configurações" className="max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="accounts" className="shrink-0 px-3">Contas</TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0 px-3">Categorias</TabsTrigger>
          {security ? <TabsTrigger value="security" className="shrink-0 px-3">Segurança</TabsTrigger> : null}
          {security ? <TabsTrigger value="mcp" className="shrink-0 px-3">MCP</TabsTrigger> : null}
        </TabsList>

        <SettingsViewTabsContent1 accounts={accounts} />

        <SettingsViewTabsContent2 categoriesByGroup={categoriesByGroup} />

        {security ? (
          <TabsContent value="security">
            <SecuritySettings lockTimeoutMinutes={security.lockTimeoutMinutes} lockOnClose={security.lockOnClose} />
          </TabsContent>
        ) : null}

        {security ? (
          <TabsContent value="mcp">
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <McpTokenSettings hasMcpToken={security.hasMcpToken} />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
