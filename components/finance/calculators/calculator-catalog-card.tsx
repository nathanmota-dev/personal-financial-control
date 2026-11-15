import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import type { CalculatorCatalogCardProps } from "@/lib/interfaces/compound-interest";

export function CalculatorCatalogCard({ href, title, description, badge, illustrationSrc, highlights }: CalculatorCatalogCardProps) {
  return (
    <Link href={href} className="group block min-w-0 rounded-[20px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <article data-slot="card" className="relative flex h-full flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 transition-colors group-hover:border-primary/40">
        <DashboardCardIllustration src={illustrationSrc} className="top-4 right-5 size-[72px]" />
        <span className="self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{badge}</span>
        <h2 className="mt-4 pr-20 text-lg font-semibold leading-[25px] text-content-strong">{title}</h2>
        <p className="mt-1 pr-20 text-xs leading-5 text-content-muted">{description}</p>
        <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">O que você descobre</p>
        <ul className="mt-2 divide-y divide-border">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-center gap-2.5 py-2.5 text-[13px] text-content-strong">
              <Check aria-hidden className="size-3.5 shrink-0 text-success" />{highlight}
            </li>
          ))}
        </ul>
        <span className="mt-auto pt-6">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-content-strong transition-colors group-hover:bg-muted">
            Abrir calculadora<ArrowUpRight aria-hidden className="size-3.5" />
          </span>
        </span>
      </article>
    </Link>
  );
}
