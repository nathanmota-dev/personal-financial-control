import { AlertTriangle } from "lucide-react";

import type { AlertListItemProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

export function AlertListItem({ danger, title, detail }: AlertListItemProps) {
  return (
    <li className="flex gap-3 py-3 text-[13px]">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", danger ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
        <AlertTriangle aria-hidden className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-content-strong">{title}</p>
        <p className="mt-0.5 text-xs text-content-muted">{detail}</p>
      </div>
    </li>
  );
}
