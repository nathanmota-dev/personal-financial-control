import { Card, CardContent } from "@/components/ui/card";
import type { CompoundInterestResultMetricProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestResultMetric({
  title,
  value,
  detail,
  icon,
  featured = false,
}: CompoundInterestResultMetricProps) {
  return (
    <Card
      className={
        featured
          ? "border-brand/50 bg-brand text-primary-foreground"
          : "bg-surface/80"
      }
    >
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className={featured ? "text-primary-foreground/75" : "text-content"}>
            {title}
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {value}
          </p>
          <p
            className={
              featured
                ? "mt-2 text-xs text-primary-foreground/65"
                : "mt-2 text-xs text-content-muted"
            }
          >
            {detail}
          </p>
        </div>
        <span
          className={
            featured
              ? "rounded-full bg-primary-foreground/15 p-2.5"
              : "rounded-full border border-border bg-surface-raised p-2.5 text-brand"
          }
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
