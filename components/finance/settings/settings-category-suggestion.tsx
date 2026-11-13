"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { createCategoryAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { SettingsCategorySuggestionProps } from "@/lib/interfaces/settings";

export function SettingsCategorySuggestion({ entry }: SettingsCategorySuggestionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <li>
      <button
        type="button"
        disabled={isPending}
        aria-label={`Adicionar categoria ${entry.name}`}
        onClick={() =>
          startTransition(async () => {
            try {
              await createCategoryAction({ name: entry.name, group: entry.group });
              toast.success(`Categoria ${entry.name} adicionada.`);
              router.refresh();
            } catch (error) {
              toast.error(extractErrorMessage(error));
            }
          })
        }
        className="group flex h-9 items-center gap-2 rounded-full border border-border bg-card pr-2.5 pl-3 text-[13px] font-medium text-content-strong transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
      >
        <span aria-hidden className="text-base leading-none">{entry.emoji}</span>
        {entry.name}
        <Plus aria-hidden className="size-3.5 text-content-subtle transition-colors group-hover:text-primary" />
      </button>
    </li>
  );
}
