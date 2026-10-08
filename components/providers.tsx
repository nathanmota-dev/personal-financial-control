"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { AppLocaleProvider } from "@/components/i18n/app-locale-provider";
import { getIntlMessages } from "@/lib/i18n/messages";
import { defaultLocale, type Locale } from "@/lib/i18n/locale";
import type { I18nMessages, ProvidersProps } from "@/lib/interfaces/i18n";

const catalogs: Record<Locale, I18nMessages> = {
  pt: getIntlMessages("pt"),
  en: getIntlMessages("en"),
};

export function Providers({
  children,
  initialLocale = defaultLocale,
  initialMessages,
}: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // Initialization is handled by next/script in RootLayout. Keep the
      // library's inline script inert when React mounts this provider.
      scriptProps={{ type: "application/json" }}
    >
      <AppLocaleProvider
        initialLocale={initialLocale}
        initialMessages={initialMessages ?? catalogs[initialLocale]}
      >
        {children}
        <Toaster richColors position="top-right" />
      </AppLocaleProvider>
    </ThemeProvider>
  );
}
