import { Label } from "@/components/ui/label";
import type { PortfolioFieldProps } from "@/lib/interfaces/investment-portfolio";

export function PortfolioField({ label, htmlFor, children }: PortfolioFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-content">
        {label}
      </Label>
      {children}
    </div>
  );
}
