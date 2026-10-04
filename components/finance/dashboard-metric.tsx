import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { MetricCardProps } from "@/lib/interfaces/dashboard";

export function DashboardMetric({
  label,
  value,
  comparison,
}: MetricCardProps) {
  const Icon = comparison.tone === "neutral" && comparison.description.startsWith("Sem movimentações")
    ? Minus : comparison.direction === "up" ? TrendingUp : comparison.direction === "down" ? TrendingDown : Minus;
  const accent = comparison.tone === "positive" ? "text-success" : comparison.tone === "negative" ? "text-danger" : "text-content-subtle";
  return (
    <article aria-label={label} className="relative flex h-[154px] min-w-0 flex-col rounded-[20px] border border-border bg-card px-[18px] pt-[19px] pb-[28px]">
      <p className="max-w-[140px] pr-1 text-[13px] leading-[16px] font-semibold text-content">
        {label}
      </p>
      <span className={`absolute top-[23px] right-[18px] ${accent}`}>
        <Icon className="size-[19px]" aria-label={comparison.description} />
      </span>
      <p className="absolute top-[50px] left-[18px] right-2 whitespace-nowrap text-[clamp(20px,1.875vw,32px)] leading-[34px] font-[650] tracking-[-0.8px] xl:text-[27px]">
        {value}
      </p>
      <p className="mt-auto text-[11px] leading-[15px] text-content-subtle">
        {comparison.description}
      </p>
    </article>
  );
}
