"use client";
import type {
ToggleFilterProps
} from "@/app/interfaces/projected-balance";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ToggleFilter({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleFilterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4",
        disabled && "opacity-60"
      )}
    >
      <div>
        <p className="font-medium text-content-strong">{label}</p>
        <p className="mt-1 text-sm text-content">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="data-checked:bg-brand"
      />
    </div>
  );
}
