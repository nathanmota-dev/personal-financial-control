import type { AbstractIntlMessages } from "next-intl";

import type { Locale } from "@/lib/i18n/locale";

export type I18nMessages = AbstractIntlMessages;

export interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale: Locale;
  initialMessages: I18nMessages;
}

export interface ProvidersProps {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialMessages?: I18nMessages;
}

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
