import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controle Financeiro Pessoal",
  description: "Painel financeiro pessoal com dashboard, lançamentos, recorrências e carteira.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark h-full">
      <body suppressHydrationWarning className="min-h-full font-sans text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
