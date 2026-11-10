import { IconTile } from "@/components/finance/ds/icon-tile";
import type { FinanceMetricProps } from "@/lib/interfaces/finance-presentation";
import { cn } from "@/lib/utils";

export function FinanceMetric({
  label,
  value,
  description,
  icon,
  footer,
  tone = "neutral",
  className,
}: FinanceMetricProps) {
  return (
    <article
      aria-label={label}
      data-slot="card"
      className={cn(
        "group/metric relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-[20px] border border-border bg-card p-5 text-card-foreground transition-colors hover:border-content-subtle/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] leading-4 font-medium text-content">{label}</p>
        {icon && <IconTile tone={tone} size="sm">{icon}</IconTile>}
      </div>
      <div className="mt-auto space-y-1">
        <p className="text-[clamp(20px,1.7vw,26px)] leading-8 font-semibold tracking-[-0.6px] break-words tabular-nums">{value}</p>
        {description && <p className="text-xs leading-4 text-content-muted">{description}</p>}
      </div>
      {footer}
    </article>
  );
}
