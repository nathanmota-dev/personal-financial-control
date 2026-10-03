import type { FinanceMetricProps } from "@/lib/interfaces/finance-presentation";
import { cn } from "@/lib/utils";

const iconTones = {
  neutral: "text-content-muted",
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function FinanceMetric({
  label,
  value,
  description,
  icon,
  tone = "neutral",
  className,
}: FinanceMetricProps) {
  return (
    <article
      className={cn(
        "flex min-h-[154px] min-w-0 flex-col rounded-[20px] border border-border bg-card px-[18px] py-5",
        className,
      )}
    >
      <div className="flex min-h-9 items-start justify-between gap-3">
        <p className="text-[13px] leading-[18px] font-semibold text-content">
          {label}
        </p>
        {icon && (
          <span className={cn("shrink-0 [&>svg]:size-[19px]", iconTones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 break-words text-[clamp(20px,1.85vw,27px)] leading-tight font-[650] tracking-[-0.8px] text-content-strong tabular-nums">
        {value}
      </p>
      {description && (
        <p className="mt-auto pt-4 text-[11px] leading-4 text-content-subtle">
          {description}
        </p>
      )}
    </article>
  );
}
