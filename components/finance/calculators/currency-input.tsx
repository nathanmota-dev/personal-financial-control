import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  appendDigitToMoneyInput,
  formatMoneyInput,
  removeDigitFromMoneyInput,
} from "@/lib/finance-ui";
import type { CurrencyInputProps } from "@/lib/interfaces/compound-interest";

function isEntireValueSelected(input: HTMLInputElement) {
  return input.selectionStart === 0 && input.selectionEnd === input.value.length;
}

export function CurrencyInput({
  id,
  label,
  value,
  onValueChange,
}: CurrencyInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex rounded-xl border border-input bg-surface-raised/45 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <span className="flex items-center border-r border-input px-3 text-xs font-semibold text-content">
          R$
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          lang="pt-BR"
          autoComplete="off"
          placeholder="0,00"
          value={value}
          onKeyDown={(event) => {
            if (/^\d$/.test(event.key)) {
              event.preventDefault();
              onValueChange(
                appendDigitToMoneyInput(
                  value,
                  event.key,
                  isEntireValueSelected(event.currentTarget)
                )
              );
              return;
            }

            if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              onValueChange(
                removeDigitFromMoneyInput(
                  value,
                  isEntireValueSelected(event.currentTarget)
                )
              );
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            onValueChange(formatMoneyInput(event.clipboardData.getData("text")));
          }}
          onChange={(event) => onValueChange(formatMoneyInput(event.target.value))}
          onBlur={(event) => onValueChange(formatMoneyInput(event.currentTarget.value))}
          className="h-11 border-0 bg-transparent font-mono shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
