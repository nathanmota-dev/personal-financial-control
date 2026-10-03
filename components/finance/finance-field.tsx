import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FinanceFieldProps } from "@/lib/interfaces/finance-fields";
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
