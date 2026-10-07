"use client";

import { UserControls } from "@/components/auth/user-controls";
import { FinanceCommandPalette } from "@/components/finance/finance-command-palette";
import { FinanceCommandTrigger } from "@/components/finance/finance-command-trigger";
import { FinanceSidebar } from "@/components/finance/finance-sidebar";
import { MobileNavigation } from "@/components/finance/mobile-navigation";
import { RecurringAutoGenerator } from "@/components/finance/recurring-auto-generator";
import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import type { AppShellProps } from "@/lib/interfaces/app-shell";
import { FlaskConical } from "lucide-react";
import { useState } from "react";

export function AppShell({ children, demoMode, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const openCommandPalette = () => setCommandPaletteOpen(true);

  return (
    <div className="min-h-screen bg-app-shell text-content-strong">
      <FinanceCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      <RecurringAutoGenerator demoMode={demoMode} />
      <div className="flex min-h-screen">
        <FinanceSidebar
          collapsed={collapsed}
          demoMode={demoMode}
          user={user}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onOpenCommandPalette={openCommandPalette}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-7 lg:pb-[106px] lg:pl-[29px] lg:pr-[55px] lg:pt-8 min-[100.0625rem]:pt-14">
          <header className="flex items-center justify-between gap-2 rounded-[20px] border border-border bg-card px-4 py-3 md:px-6 lg:hidden">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand sm:text-[0.72rem] sm:tracking-[0.32em]">
                Controle Financeiro
              </p>
              <p className="hidden text-sm text-content sm:block">
                Navegação principal
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <FinanceCommandTrigger
                compact
                onOpen={openCommandPalette}
                className="size-9 border border-border bg-card"
              />
              <FinancialPrivacyToggle compact />
              <UserControls user={user} demoMode={demoMode} />
              <MobileNavigation user={user} demoMode={demoMode} />
            </div>
          </header>

          <main className="min-w-0 flex-1 min-[100.0625rem]:[&>.space-y-6]:space-y-5">
            {demoMode ? (
              <div className="mb-6 flex flex-col gap-2 rounded-[1.5rem] border border-warning/25 bg-warning/10 px-5 py-4 text-warning shadow-[0_18px_50px_rgb(var(--surface-rgb) / .2)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                    <FlaskConical className="size-3.5" />
                    Demo pública
                  </span>
                  <p className="text-sm text-warning/80">
                    Sem login. Dados fictícios para explorar o produto.
                  </p>
                </div>
                <p className="text-xs text-warning/60 sm:text-right">
                  Alterações temporárias e compartilhadas. Não insira dados
                  pessoais.
                </p>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
