"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_GROUP_DISPLAY, buildCategoryMarkers } from "@/lib/category-markers";
import { categoryGroupLabels } from "@/lib/finance-ui";
import type { SettingsCategoriesPanelProps } from "@/lib/interfaces/settings";

import { SettingsCategoryRow } from "./settings-category-row";
import { SettingsCategorySuggestions } from "./settings-category-suggestions";

export function SettingsCategoriesPanel({ categories }: SettingsCategoriesPanelProps) {
  const markers = useMemo(() => buildCategoryMarkers(categories), [categories]);
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <section aria-label="Categorias" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/category-tag.webp" />
      <div className="flex flex-wrap items-start justify-between gap-3 pr-16">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-[25px]">Categorias</h2>
            <Badge variant="outline" className="border-input text-content">{categories.length}</Badge>
          </div>
          <p className="mt-1 text-xs text-content-muted">Usadas em lançamentos, recorrências, orçamentos e relatórios. Categorias fora da lista sugerida ganham uma cor própria.</p>
        </div>
        <CategorySetupDialog trigger={<Button className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium"><Plus className="size-[17px]" />Nova categoria</Button>} />
      </div>
      {categories.length ? (
        <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2 2xl:grid-cols-4">
          {CATEGORY_GROUP_DISPLAY.map(({ group, dotClassName }) => {
            const rows = categories
              .filter((category) => category.group === group)
              .sort((left, right) => Number(left.isArchived) - Number(right.isArchived) || left.name.localeCompare(right.name, "pt-BR"));
            return (
              <div key={group} className="min-w-0">
                <h3 className="flex items-center justify-between border-b border-border pb-2 text-[10px] font-bold tracking-wider text-content uppercase">
                  {categoryGroupLabels[group]}
                  <span className="font-semibold text-content-subtle">{rows.length}</span>
                </h3>
                {rows.length ? (
                  <ul className="mt-1">{rows.map((category) => <SettingsCategoryRow key={category.id} category={category} dotClassName={dotClassName} marker={markers.get(category.id)} />)}</ul>
                ) : (
                  <p className="py-3 text-xs text-content-muted">Nenhuma categoria neste grupo.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4">
          <FinanceEmptyState title="Nenhuma categoria cadastrada" description="Crie categorias de receita, despesa e aporte para usar em todas as outras telas." />
        </div>
      )}
    </section>
    <SettingsCategorySuggestions categories={categories} />
    </div>
  );
}
