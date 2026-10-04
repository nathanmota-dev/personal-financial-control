import { Label } from "@/components/ui/label";
import type { FinanceFieldProps } from "@/lib/interfaces/finance-fields";
import { cn } from "@/lib/utils";
export function FinanceField({
  label,
  children,
  className,
}: FinanceFieldProps) {
  return (
    <Label
      className={cn(
        "grid min-w-0 gap-2 text-xs font-medium text-muted-foreground [&>input]:font-normal [&>input]:text-foreground [&>button]:font-normal [&>button]:text-foreground",
        className,
      )}
    >
      {label}
      {children}
    </Label>
  );
}
