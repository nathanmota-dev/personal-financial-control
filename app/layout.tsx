import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { getLocale, getMessages } from "next-intl/server";

import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/i18n/locale";
import { themeInitializationScript } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: "Finance",
    description: locale === "en"
      ? "Personal finance dashboard with transactions, recurring items, and investments."
      : "Painel financeiro pessoal com dashboard, lançamentos, recorrências e carteira.",
    other: { google: "notranslate" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html
      lang={locale === "pt" ? "pt-BR" : "en"}
      translate="no"
      suppressHydrationWarning
      className={`${inter.variable} h-full notranslate`}
    >
      <body
        translate="no"
        suppressHydrationWarning
        className="min-h-full font-sans text-content-strong notranslate"
      >
        <Script id="theme-initialization" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
        <Providers initialLocale={locale as Locale} initialMessages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
