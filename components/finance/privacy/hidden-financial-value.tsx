import { EyeOff } from "lucide-react";
import { HIDDEN_FINANCIAL_VALUE } from "@/lib/financial-privacy";

export function HiddenFinancialValue() {
  return (
    <span
      className="inline-flex size-4 shrink-0 align-middle"
      role="img"
      aria-label={HIDDEN_FINANCIAL_VALUE}
    >
      <EyeOff className="size-4" aria-hidden="true" />
    </span>
  );
}
