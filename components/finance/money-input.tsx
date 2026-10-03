"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput } from "@/lib/finance-ui";
import { maskMoneyInput, formatPastedMoney } from "@/lib/money-input";
import type { MoneyInputProps } from "@/lib/interfaces/finance-fields";
import { cn } from "@/lib/utils";

export function MoneyInput({
  value,
  defaultValue = "",
  onValueChange,
  onChange,
  onPaste,
  className,
  ...props
}: MoneyInputProps) {
  const [internalValue, setInternalValue] = useState(() =>
    formatMoneyInput(defaultValue),
  );
  const currentValue = value === undefined ? internalValue : value;
  function update(next: string) {
    setInternalValue(next);
    onValueChange?.(next);
  }
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={currentValue}
      className={cn("tabular-nums", className)}
      onChange={(event) => {
        const next = maskMoneyInput(event.currentTarget.value);
        event.currentTarget.value = next;
        update(next);
        onChange?.(event);
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const next = formatPastedMoney(event.clipboardData.getData("text"));
        // Dispatch an input event so controlled callers using onChange receive pasted values too.
        const input = event.currentTarget;
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;
        setter?.call(input, next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }}
    />
  );
}
