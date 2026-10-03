import { MoneyInput } from "@/components/finance/money-input";
import { Label } from "@/components/ui/label";
import type { CurrencyInputProps } from "@/lib/interfaces/compound-interest";
export function CurrencyInput({ id, label, value, onValueChange }: CurrencyInputProps) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">R$</span><MoneyInput id={id} value={value} onValueChange={onValueChange} placeholder="0,00" className="pl-10" /></div></div>;
}
