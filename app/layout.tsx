import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { themeInitializationScript } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finance",
  description:
    "Painel financeiro pessoal com dashboard, lançamentos, recorrências e carteira.",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
