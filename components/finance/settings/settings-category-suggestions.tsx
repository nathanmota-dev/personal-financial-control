"use client";

import { useMemo } from "react";

import { CATEGORY_GROUP_DISPLAY, suggestCatalogCategories } from "@/lib/category-markers";
import { categoryGroupLabels } from "@/lib/finance-ui";
import type { SettingsCategorySuggestionsProps } from "@/lib/interfaces/settings";
import { cn } from "@/lib/utils";

import { SettingsCategorySuggestion } from "./settings-category-suggestion";

export function SettingsCategorySuggestions({ categories }: SettingsCategorySuggestionsProps) {
  const suggestions = useMemo(() => suggestCatalogCategories(categories), [categories]);
  return (
    <section aria-label="Categorias sugeridas" className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <h2 className="text-lg font-semibold leading-[25px]">Categorias sugeridas</h2>
      <p className="mt-1 text-xs text-content-muted">As categorias mais comuns, já com emoji. Clique para adicionar; para algo que não está aqui, use “Nova categoria”.</p>
      {suggestions.length ? (
        <div className="mt-5 space-y-5">
          {CATEGORY_GROUP_DISPLAY.map(({ group, dotClassName }) => {
            const entries = suggestions.filter((entry) => entry.group === group);
            if (!entries.length) return null;
            return (
              <div key={group}>
                <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-content uppercase">
                  <span aria-hidden className={cn("size-2 rounded-full", dotClassName)} />
                  {categoryGroupLabels[group]}
                  <span className="font-semibold text-content-subtle">{entries.length}</span>
                </h3>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {entries.map((entry) => <SettingsCategorySuggestion key={entry.name} entry={entry} />)}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-[13px] text-content">Você já adicionou todas as categorias sugeridas.</p>
      )}
    </section>
  );
}
