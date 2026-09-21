import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalculatorCatalogCardProps } from "@/lib/interfaces/compound-interest";

export function CalculatorCatalogCard({
  href,
  title,
  description,
  badge,
}: CalculatorCatalogCardProps) {
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="relative h-full min-h-64 border-brand/25 bg-[radial-gradient(circle_at_top_right,rgb(var(--brand-rgb)/.18),transparent_42%),var(--surface)] transition duration-300 group-hover:-translate-y-1 group-hover:border-brand/55 group-hover:shadow-[0_28px_90px_rgb(var(--surface-rgb)/.55)] group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
        <CardHeader className="border-0 pb-0">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-brand/30 bg-brand/12 text-brand">
              <TrendingUp className="size-5" />
            </span>
            <span className="rounded-full border border-border bg-surface-raised/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-content">
              {badge}
            </span>
          </div>
          <CardTitle className="mt-8 font-heading text-2xl text-content-strong">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto flex items-end justify-between gap-6">
          <p className="max-w-sm text-sm leading-6 text-content">{description}</p>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground transition-transform group-hover:rotate-12">
            <ArrowUpRight className="size-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
