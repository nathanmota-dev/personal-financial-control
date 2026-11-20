import type { StatGridProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

/** Four-up stat row at the bottom of a type A hero card. */
export function StatGrid({ stats }: StatGridProps) {
  return (
    <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
          <dd className={cn("mt-1 truncate text-[15px] font-semibold text-content-strong tabular-nums", stat.className)}>{stat.value}</dd>
          <p className="mt-0.5 truncate text-[11px] text-content-subtle">{stat.hint}</p>
        </div>
      ))}
    </dl>
  );
}
