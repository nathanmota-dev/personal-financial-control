"use client";

import { CARD_BRAND_THEMES } from "@/lib/credit-card-brands";
import type { SettingsCardBrandPickerProps } from "@/lib/interfaces/settings";
import { SETTINGS_CARD_BRANDS } from "@/lib/settings-cards";
import { cn } from "@/lib/utils";

export function SettingsCardBrandPicker({ value, onChange }: SettingsCardBrandPickerProps) {
  return (
    <div role="radiogroup" aria-label="Banco do cartão" className="grid grid-cols-3 gap-2 @lg:grid-cols-5">
      {SETTINGS_CARD_BRANDS.map((brand) => {
        const theme = CARD_BRAND_THEMES[brand];
        const selected = brand === value;
        return (
          <button
            key={brand}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(brand)}
            className={cn(
              "flex h-[58px] min-w-0 flex-col items-start justify-between rounded-[14px] border p-2 text-left transition-colors",
              selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted",
            )}
          >
            <span aria-hidden className={cn("h-3 w-6 rounded-[3px]", theme.faceClassName)} />
            <span className="w-full truncate text-[11px] font-semibold text-content-strong">{brand === "generic" ? "Outro" : theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
