import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinanceMetricProps } from "@/lib/interfaces/finance-presentation";
import { cn } from "@/lib/utils";

const iconTones = {
  neutral: "text-muted-foreground",
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
    <Card className={cn("min-w-0 gap-3 py-5", className)}>
      <CardHeader className="gap-0 px-5">
        <CardTitle className="text-sm font-medium text-content">{label}</CardTitle>
        {icon && (
          <CardAction className={cn("[&>svg]:size-4", iconTones[tone])}>
            {icon}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="mt-auto space-y-1.5 px-5">
        <p className="break-words text-2xl leading-8 font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {description && <CardDescription className="text-xs leading-4">{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}
