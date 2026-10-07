"use client";

import type { FinanceCommandTriggerProps } from "@/lib/interfaces/finance-command";
import { cn } from "@/lib/utils";
import { Command as CommandIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribeToPlatform() {
  return () => {};
}

function getPlatformShortcut() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}

function getServerShortcut() {
  return "Ctrl K";
}

export function FinanceCommandTrigger({
  onOpen,
  compact = false,
  showShortcut = false,
  className,
}: FinanceCommandTriggerProps) {
  const shortcut = useSyncExternalStore(
    subscribeToPlatform,
    getPlatformShortcut,
    getServerShortcut,
  );

  return (
    <button
      type="button"
      aria-label={`Abrir paleta de comandos (${shortcut})`}
      onClick={onOpen}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-content-muted transition-colors hover:bg-sidebar-accent hover:text-content-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        compact
          ? showShortcut
            ? "h-7 gap-1 px-1"
            : "size-7"
          : "h-7 px-1.5",
        className,
      )}
    >
      <CommandIcon className="size-3.5" aria-hidden="true" />
      {!compact ? <span className="sr-only sm:not-sr-only">Comandos</span> : null}
      <kbd
        className={cn(
          "rounded border border-border px-1 text-[10px] leading-[17px]",
          compact && !showShortcut && "sr-only",
        )}
      >
        {shortcut}
      </kbd>
    </button>
  );
}
