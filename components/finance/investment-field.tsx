import { MoneyInput } from "@/components/finance/money-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InvestmentFieldProps } from "@/lib/interfaces/investments";

export function InvestmentField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  monetary,
}: InvestmentFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-content-strong">
        {label}
      </Label>
      {monetary ? (
        <MoneyInput
          id={id}
          value={value}
          onValueChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
