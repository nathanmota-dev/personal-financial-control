"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
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
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
