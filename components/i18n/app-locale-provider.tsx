"use client";

import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import type { LocaleProviderProps, LocaleContextValue, I18nMessages } from "@/lib/interfaces/i18n";
import { getIntlMessages } from "@/lib/i18n/messages";
import { isLocale, localeCookieName, type Locale } from "@/lib/i18n/locale";
import { LocaleDomBridge } from "@/components/i18n/locale-dom-bridge";

const LocaleContext = createContext<LocaleContextValue | null>(null);
const catalogs: Record<Locale, I18nMessages> = {
  pt: getIntlMessages("pt"),
  en: getIntlMessages("en"),
};

function readCookie(name: string): string | null {
  const entry = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function getPreferredLocale(fallback: Locale): Locale {
  const cookieLocale = readCookie(localeCookieName);
  if (isLocale(cookieLocale)) return cookieLocale;

  try {
    const storedLocale = window.localStorage.getItem(localeCookieName);
    if (isLocale(storedLocale)) return storedLocale;
  } catch {
    // The request locale remains available when browser storage is unavailable.
  }

  return fallback;
}

function subscribeToLocaleChanges(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("locale-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("locale-change", onChange);
  };
}

function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(localeCookieName, locale);
  } catch {
    // The cookie remains the server-readable preference when browser storage is unavailable.
  }
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  window.dispatchEvent(new Event("locale-change"));
}

export function AppLocaleProvider({ children, initialLocale, initialMessages }: LocaleProviderProps) {
  const router = useRouter();
  const hasSyncedInitialLocale = useRef(false);
  const getSnapshot = useCallback(() => getPreferredLocale(initialLocale), [initialLocale]);
  const locale = useSyncExternalStore(subscribeToLocaleChanges, getSnapshot, () => initialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    persistLocale(nextLocale);
    if (nextLocale === locale) return;
    router.refresh();
  }, [locale, router]);

  useEffect(() => {
    const preferredLocale = getPreferredLocale(initialLocale);
    if (!hasSyncedInitialLocale.current) {
      hasSyncedInitialLocale.current = true;
      if (preferredLocale !== initialLocale) {
        persistLocale(preferredLocale);
        router.refresh();
        return;
      }
    }

    if (preferredLocale === locale) persistLocale(locale);
  }, [initialLocale, locale, router]);

  const contextValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  const messages = locale === initialLocale ? initialMessages : catalogs[locale];

  return (
    <LocaleContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
        <LocaleDomBridge />
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useAppLocale must be used inside AppLocaleProvider");
  return context;
}
