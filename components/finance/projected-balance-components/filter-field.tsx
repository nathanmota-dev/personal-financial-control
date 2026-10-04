"use client";
import type {
FilterFieldProps
} from "@/app/interfaces/projected-balance";
import { Label } from "@/components/ui/label";

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-content">
        {label}
      </Label>
      {children}
    </div>
  );
}
