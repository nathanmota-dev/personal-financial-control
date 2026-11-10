import { IconTile } from "@/components/finance/ds/icon-tile";
import { Card } from "@/components/ui/card";
import type { SectionCardProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

export function SectionCard({ title, description, count, icon, tone = "brand", action, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <IconTile tone={tone} size="sm">{icon}</IconTile>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base leading-6 font-semibold text-content-strong">{title}</h2>
              {count !== undefined && <span aria-hidden="true" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-content tabular-nums">{count}</span>}
            </div>
            {description && <p className="text-xs leading-5 text-content-muted">{description}</p>}
          </div>
        </div>
        {action && <div className="flex max-w-full flex-wrap items-center gap-2">{action}</div>}
      </div>
      <div className={cn("px-5 py-5 sm:px-6", contentClassName)}>{children}</div>
    </Card>
  );
}
