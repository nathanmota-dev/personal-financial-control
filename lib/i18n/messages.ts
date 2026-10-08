import type { AbstractIntlMessages } from "next-intl";

import type { Locale } from "@/lib/i18n/locale";
import englishMessages from "@/public/i18n/en.json";
import portugueseMessages from "@/public/i18n/pt.json";

const catalogs = {
  pt: portugueseMessages,
  en: englishMessages,
} as const;

export function getIntlMessages(locale: Locale): AbstractIntlMessages {
  const catalog = catalogs[locale];
  return {
    metadata: catalog.metadata,
    accountPreferences: catalog.accountPreferences,
  };
}
