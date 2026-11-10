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
        "flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-muted/50 px-4 py-3 transition-colors has-[[data-state=checked]]:border-brand/30 has-[[data-state=checked]]:bg-brand/[0.07]",
        disabled && "opacity-60"
      )}
    >
      <div>
        <p className="text-sm font-medium text-content-strong">{label}</p>
        <p className="text-xs text-content-muted">{description}</p>
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
