import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import type { CalculatorFormCardProps } from "@/lib/interfaces/compound-interest";

/** Type B card that frames the inputs of a calculator. */
export function CalculatorFormCard({ illustrationSrc, title, description, children }: CalculatorFormCardProps) {
  return (
    <section aria-label={title} className="@container relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src={illustrationSrc} />
      <h2 className="text-lg font-semibold leading-[25px] text-content-strong">{title}</h2>
      <p className="mt-1 pr-20 text-xs leading-5 text-content-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
