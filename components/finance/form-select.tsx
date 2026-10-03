"use client";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormSelectProps } from "@/lib/interfaces/finance-fields";
import { cn } from "@/lib/utils";
export function FormSelect({
  id,
  className,
  placeholder = "Selecione",
  children,
  "aria-label": ariaLabel,
  ...props
}: FormSelectProps) {
  return (
    <Select {...props}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">{children}</SelectContent>
    </Select>
  );
}
