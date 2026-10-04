import { ArrowUpRight,TrendingUp } from "lucide-react";
import Link from "next/link";

import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import type { CalculatorCatalogCardProps } from "@/lib/interfaces/compound-interest";

export function CalculatorCatalogCard({
  href,
  title,
  description,
  badge,
}: CalculatorCatalogCardProps) {
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="relative h-full min-h-64 border-border bg-card transition duration-300 group-hover:-translate-y-1 group-hover:border-brand/55 shadow-none group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
        <CardHeader className="border-0 pb-0">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex size-12 items-center justify-center rounded-[11px] bg-brand-soft text-brand">
              <TrendingUp className="size-5" />
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-semibold text-content">
              {badge}
            </span>
          </div>
          <CardTitle className="mt-8 text-2xl text-content-strong">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto flex items-end justify-between gap-6">
          <p className="max-w-sm text-sm leading-6 text-content">{description}</p>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground transition-transform group-hover:rotate-12">
            <ArrowUpRight className="size-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
