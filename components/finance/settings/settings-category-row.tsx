"use client";

import { Pencil } from "lucide-react";

import { ArchiveCategoryButton } from "@/components/finance/archive-category-button";
import { DeleteCategoryButton } from "@/components/finance/delete-category-button";
import { CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import type { SettingsCategoryRowProps } from "@/lib/interfaces/settings";
import { cn } from "@/lib/utils";

export function SettingsCategoryRow({ category, dotClassName, marker }: SettingsCategoryRowProps) {
  return (
    <li aria-label={category.name} className="group flex min-h-11 items-center gap-3 py-1.5 text-[13px]">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dotClassName, category.isArchived && "opacity-40")} />
      <span aria-hidden className={cn("flex w-5 shrink-0 items-center justify-center text-base leading-none", category.isArchived && "opacity-50 grayscale")}>
        {marker?.kind === "emoji" ? marker.emoji : <span className="size-3.5 rounded-full ring-2 ring-card" style={{ backgroundColor: marker?.color }} />}
      </span>
      <span className={cn("min-w-0 flex-1 truncate font-medium", category.isArchived ? "text-content-muted" : "text-content-strong")}>
        <span data-user-content>{category.name}</span>
        {category.isArchived ? <span className="ml-2 text-[11px] font-normal text-content-subtle">Arquivada</span> : null}
      </span>
      <span className="flex shrink-0 gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <CategorySetupDialog
          category={category}
          trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar"><Pencil className="size-4" /></Button>}
        />
        {!category.isArchived ? <ArchiveCategoryButton id={category.id} /> : null}
        <DeleteCategoryButton id={category.id} />
      </span>
    </li>
  );
}
