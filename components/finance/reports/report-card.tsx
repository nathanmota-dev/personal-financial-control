import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import type { ReportCardProps } from "@/lib/interfaces/reports";
import { cn } from "@/lib/utils";

export function ReportCard({ title, description, badge, action, ariaLabel, illustrationSrc, className, children }: ReportCardProps) {
  return (
    <section aria-label={ariaLabel} className={cn("relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6", className)}>
      {illustrationSrc && <DashboardCardIllustration src={illustrationSrc} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={cn("min-w-0", illustrationSrc && "pr-16")}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-[25px]">{title}</h2>
            {badge}
          </div>
          {description && <p className="mt-1 text-xs text-content-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
