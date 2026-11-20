"use client";

import { TableRow } from "@/components/ui/table";
import type { ClickableTableRowProps } from "@/lib/interfaces/day-detail";
import { cn } from "@/lib/utils";

/** Table row that opens a detail with a click, Enter or Space. */
export function ClickableTableRow({ onActivate, className, ...props }: ClickableTableRowProps) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onActivate();
        }
      }}
      className={cn("cursor-pointer border-border hover:bg-card", className)}
      {...props}
    />
  );
}
