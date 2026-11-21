"use client";

import { Button } from "@/components/ui/button";
import type { ReserveShortcutButtonsProps } from "@/lib/interfaces/components/reserve-shortcuts";
import { cn } from "@/lib/utils";

export function ReserveShortcutButtons({ shortcuts, onPick, className }: ReserveShortcutButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {shortcuts.map((shortcut) => (
        <Button key={shortcut.label} type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => onPick(shortcut.cents)}>
          {shortcut.label}
        </Button>
      ))}
    </div>
  );
}
