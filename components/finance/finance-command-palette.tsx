"use client";

import {
  Command,
  CommandInput,
  CommandDialog,
} from "@/components/ui/command";
import { FinanceCommandResults } from "@/components/finance/finance-command-results";
import type {
  FinanceCommandActionDefinition,
  FinanceCommandPaletteProps,
} from "@/lib/interfaces/finance-command";
import {
  buildFinanceCommandHref,
  FINANCE_COMMAND_ACTIONS,
  matchesFinanceCommand,
} from "@/lib/finance-command-catalog";
import { getFinancePageDestinations } from "@/lib/finance-navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef } from "react";

function commandFilter(value: string, search: string) {
  return matchesFinanceCommand(value, search) ? 1 : 0;
}

function hasOpenDialog() {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'));
}

export function FinanceCommandPalette({ open, onOpenChange }: FinanceCommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestPrefix = useId();
  const requestSequence = useRef(0);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "k" ||
        hasOpenDialog()
      ) {
        return;
      }

      event.preventDefault();
      onOpenChange(true);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange]);

  function navigateToPage(href: string) {
    const nextHref = buildFinanceCommandHref(href, searchParams.toString());
    const currentSearch = searchParams.toString();
    const currentHref = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
    onOpenChange(false);
    if (nextHref !== currentHref) router.push(nextHref, { scroll: false });
  }

  function runAction(action: FinanceCommandActionDefinition) {
    requestSequence.current += 1;
    const commandId = `${requestPrefix}-${requestSequence.current}`;
    const nextHref = buildFinanceCommandHref(
      action.href,
      searchParams.toString(),
      action.id,
      commandId,
    );
    onOpenChange(false);
    router.push(nextHref, { scroll: false });
  }

  const pages = getFinancePageDestinations();

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Menu de comandos"
      description="Busque uma página ou ação financeira."
      className="top-[18vh] translate-y-0 sm:max-w-[560px]"
      onOpenAutoFocus={() => {
        const activeElement = document.activeElement;
        openerRef.current =
          activeElement instanceof HTMLElement ? activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        openerRef.current?.focus();
        openerRef.current = null;
      }}
    >
      <Command filter={commandFilter} label="Buscar página ou ação">
        <CommandInput placeholder="Buscar página ou ação..." />
        <FinanceCommandResults
          pages={pages}
          actions={FINANCE_COMMAND_ACTIONS}
          onNavigate={navigateToPage}
          onRunAction={runAction}
        />
      </Command>
    </CommandDialog>
  );
}
