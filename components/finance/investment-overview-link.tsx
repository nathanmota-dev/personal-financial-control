import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import type { InvestmentOverviewLinkProps } from "@/lib/interfaces/investment-operations";

export function InvestmentOverviewLink({ href, illustrationSrc, title, valueCents, detail, action }: InvestmentOverviewLinkProps) {
  return (
    <Link href={href} className="group relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring min-[100.0625rem]:p-5">
      <h2 className="text-sm font-semibold text-content-strong">{title}</h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <DashboardCardsMoney cents={valueCents} className="block text-[40px] leading-[44px] font-bold text-content-strong" />
        <DashboardCardIllustration src={illustrationSrc} className="relative top-auto right-auto -my-5 -mr-2 size-[80px] shrink-0" />
      </div>
      <p className="mt-2 text-xs text-content">{detail}</p>
      <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-content-strong transition-colors group-hover:border-primary group-hover:text-primary">
        {action}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </span>
    </Link>
  );
}
