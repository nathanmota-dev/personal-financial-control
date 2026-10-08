import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { getIntlMessages } from "@/lib/i18n/messages";
import { resolveLocale, localeCookieName } from "@/lib/i18n/locale";

export default getRequestConfig(async () => {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(localeCookieName)?.value ?? null,
    requestHeaders.get("accept-language"),
  );
  return { locale, messages: getIntlMessages(locale) };
});
