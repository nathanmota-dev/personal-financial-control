import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { Badge } from "@/components/ui/badge";
import type { BudgetCardProps } from "@/lib/interfaces/budgets";

export function BudgetCard({ title, description, count, illustrationSrc, children }: BudgetCardProps) {
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      {illustrationSrc && <DashboardCardIllustration src={illustrationSrc} />}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold leading-[25px]">{title}</h2>
        {count !== undefined && <Badge variant="outline" className="border-input text-content">{count}</Badge>}
      </div>
      <p className="mt-1 pr-16 text-xs text-content-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
