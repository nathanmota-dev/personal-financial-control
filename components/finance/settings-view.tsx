"use client";

import type { AccountRow,CategoryRow } from "@/lib/interfaces/components/settings-view";
import { useMemo } from "react";
import { SettingsViewTabsContent1 } from "./settings-view-settings-view-tabs-content1";
import { SettingsViewTabsContent2 } from "./settings-view-settings-view-tabs-content2";

import { PageHeader } from "@/components/finance/page-header";
import { Tabs,TabsList,TabsTrigger } from "@/components/ui/tabs";

export function SettingsView({
  accounts,
  categories,
}: {
  accounts: AccountRow[];
  categories: CategoryRow[];
}) {
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
        eyebrow="Configurações"
        title="Contas e categorias"
        description="Gerencie suas contas, organize categorias e mantenha sua base financeira atualizada."
      />

      <Tabs defaultValue="accounts">
        <TabsList variant="line">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <SettingsViewTabsContent1 accounts={accounts} />

        <SettingsViewTabsContent2 categoriesByGroup={categoriesByGroup} />
      </Tabs>
    </div>
  );
}
