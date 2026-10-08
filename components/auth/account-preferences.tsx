"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserControlsProps } from "@/lib/interfaces/auth";
import { Languages, Search, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useAppLocale } from "@/components/i18n/app-locale-provider";

export function AccountPreferences({ user, demoMode }: UserControlsProps) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();
  const t = useTranslations("accountPreferences");
  const themes = [
    { value: "system", label: t("automatic") },
    { value: "light", label: t("light") },
    { value: "dark", label: t("dark") },
  ];
  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-center gap-3 px-1">
        <Avatar size="lg">
          <AvatarImage src={user.photoURL ?? undefined} alt="" referrerPolicy="no-referrer" />
          <AvatarFallback>{user.name.slice(0, 1).toLocaleUpperCase("pt-BR")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p data-user-content className="truncate font-semibold">{user.name.trim().split(/\s+/)[0]}</p>
          <p data-user-content className="truncate text-xs text-content-subtle" title={user.email ?? undefined}>{user.email}</p>
        </div>
      </div>
      <button type="button" aria-disabled="true" className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-left">
        <UserRound className="size-4 text-content-subtle" />{t("myAccount")}
      </button>
      <div className="flex items-center justify-between gap-3 px-2">
        <span className="flex items-center gap-3"><Sun className="size-4 text-content-subtle" />{t("theme")}</span>
        <div role="group" aria-label={t("themeGroup")} className="flex rounded-xl bg-muted/50 p-1">
          {themes.map((option) => (
            <button key={option.value} type="button" aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}
              className="rounded-lg px-3 py-2 text-xs text-content-subtle aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:shadow-sm">
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <span className="flex items-center gap-3"><Languages className="size-4 text-content-subtle" />{t("language")}</span>
        <div role="group" aria-label={t("languageGroup")} className="flex rounded-xl bg-muted/50 p-1">
          <button type="button" aria-label={t("portuguese")} aria-pressed={locale === "pt"} onClick={() => setLocale("pt")} className="rounded-lg px-3 py-2 text-xs text-content-subtle aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:shadow-sm">PT</button>
          <button type="button" aria-label={t("english")} aria-pressed={locale === "en"} onClick={() => setLocale("en")} className="rounded-lg px-3 py-2 text-xs text-content-subtle aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:shadow-sm">EN</button>
        </div>
      </div>
      <button type="button" aria-disabled="true" className="flex h-10 w-full items-center gap-3 px-2 text-xs text-content-subtle">
        <Search className="size-4" />{t("search")} <span className="ml-auto">⌘K</span>
      </button>
      {!demoMode && <div className="border-t border-border pt-3"><LogoutButton /></div>}
    </div>
  );
}
