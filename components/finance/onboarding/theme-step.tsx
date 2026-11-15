"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ChoiceGroup } from "@/components/ui/onboarding";
import { ONBOARDING_THEMES } from "@/lib/onboarding/steps";
import { OnboardingThemePreview } from "./theme-preview";

const icons = { light: Sun, dark: Moon, system: Monitor };

export function OnboardingThemeStep() {
  const { theme, setTheme } = useTheme();
  return <div className="space-y-4">
    <ChoiceGroup name="Aparência" value={theme ?? "system"} onValueChange={setTheme} className="grid grid-cols-1 gap-3 @md:grid-cols-3">
      {ONBOARDING_THEMES.map(({ value, label }) => {
        const Icon = icons[value];
        return <ChoiceGroup.Item key={value} value={value} className="group/theme flex cursor-pointer flex-col gap-3 rounded-[14px] border-2 border-border bg-card p-2.5 text-[13px] font-semibold text-content-strong transition-colors hover:bg-muted data-[state=selected]:border-primary data-[state=selected]:bg-primary/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
          <OnboardingThemePreview theme={value} />
          <span className="flex items-center gap-2 px-1 pb-0.5"><Icon aria-hidden className="size-4 text-content group-data-[state=selected]/theme:text-primary" />{label}</span>
        </ChoiceGroup.Item>;
      })}
    </ChoiceGroup>
    <p className="text-xs text-content-muted">Sistema acompanha o tema do seu dispositivo.</p>
  </div>;
}
