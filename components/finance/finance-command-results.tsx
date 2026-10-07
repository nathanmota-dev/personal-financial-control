"use client";

import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { FinanceCommandResultsProps } from "@/lib/interfaces/finance-command";

export function FinanceCommandResults({
  pages,
  actions,
  onNavigate,
  onRunAction,
}: FinanceCommandResultsProps) {
  return (
    <CommandList>
      <CommandEmpty>Nenhuma página ou ação encontrada.</CommandEmpty>
      <CommandGroup heading="Páginas">
        {pages.map((page) => {
          const Icon = page.icon;
          const searchValue = `${page.label} ${page.aliases.join(" ")}`;
          return (
            <CommandItem
              key={`${page.href}-${page.label}`}
              value={searchValue}
              onSelect={() => onNavigate(page.href)}
            >
              <Icon className="size-4 text-content-muted" aria-hidden="true" />
              <span>{page.label}</span>
              <CommandShortcut>{page.href}</CommandShortcut>
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandGroup heading="Ações">
        {actions.map((action) => (
          <CommandItem
            key={action.id}
            value={`${action.label} ${action.description} ${action.aliases.join(" ")}`}
            onSelect={() => onRunAction(action)}
          >
            <span
              className="flex size-4 items-center justify-center rounded-full bg-brand/10 text-brand"
              aria-hidden="true"
            >
              +
            </span>
            <span>{action.label}</span>
            <CommandShortcut>{action.description}</CommandShortcut>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );
}
