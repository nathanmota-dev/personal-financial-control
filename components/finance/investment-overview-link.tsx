import { IconTile } from "@/components/finance/ds/icon-tile";
import type { InvestmentOverviewLinkProps } from "@/lib/interfaces/investment-operations";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function InvestmentOverviewLink({ href, icon, tone, title, value, detail, action }: InvestmentOverviewLinkProps) {
  return (
    <Link href={href} className="group flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-card p-5 transition-colors hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-ring">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile tone={tone} size="lg">{icon}</IconTile>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content-strong">{title}</p>
            <p className="truncate text-xs text-content-muted">{detail}</p>
          </div>
        </div>
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-content transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight className="size-4" /></span>
      </div>
      <p className="text-[28px] leading-8 font-semibold tracking-[-0.6px] break-words tabular-nums">{value}</p>
      <p className="text-xs font-medium text-brand">{action}</p>
    </Link>
  );
}
