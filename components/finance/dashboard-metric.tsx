import type { MetricCardProps } from "@/lib/interfaces/dashboard";

export function DashboardMetric({
  label,
  value,
  description,
  accent,
  icon,
}: MetricCardProps) {
  return (
    <article className="relative flex h-[154px] min-w-0 flex-col rounded-[20px] border border-border bg-card px-[18px] pt-[19px] pb-[28px]">
      <p className="max-w-[140px] pr-1 text-[13px] leading-[16px] font-semibold text-content">
        {label}
      </p>
      <span className={`absolute top-[23px] right-[18px] ${accent}`}>
        {icon}
      </span>
      <p className="absolute top-[50px] left-[18px] right-2 whitespace-nowrap text-[clamp(20px,1.875vw,32px)] leading-[34px] font-[650] tracking-[-0.8px] xl:text-[27px]">
        {value}
      </p>
      <p className="mt-auto text-[11px] leading-[15px] text-content-subtle">
        {description}
      </p>
    </article>
  );
}
