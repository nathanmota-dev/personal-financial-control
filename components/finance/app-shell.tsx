"use client";

import {
FlaskConical,
PanelLeftClose,
PanelLeftOpen,
} from "lucide-react";

import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import { UserControls } from "@/components/auth/user-controls";
import { MobileNavigation } from "@/components/finance/mobile-navigation";
import { RecurringAutoGenerator } from "@/components/finance/recurring-auto-generator";
import { SidebarFooter } from "@/components/finance/sidebar-footer";
import { SidebarNavigation } from "@/components/finance/sidebar-navigation";
import type { AppShellProps } from "@/lib/interfaces/app-shell";
import Image from "next/image";
import { useState } from "react";

export function AppShell({ children, demoMode, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-app-shell text-content-strong">
      <RecurringAutoGenerator demoMode={demoMode} />
      <div className="flex min-h-screen">
        <aside
          className={
            collapsed
              ? "hidden lg:block w-[64px] shrink-0 bg-sidebar"
              : "hidden w-[238px] shrink-0 bg-sidebar lg:block"
          }
        >
          <div className="sticky top-0 flex h-dvh max-h-[1056px] flex-col">
            <div className="flex h-[82px] shrink-0 items-start gap-[11px] pl-6 pr-[14px] pt-6">
              {!collapsed && (
                <>
                  <Image
                    src="/icon.png"
                    width={30}
                    height={30}
                    sizes="30px"
                    alt=""
                    className="size-[30px] shrink-0 rounded-[7px] object-contain"
                  />
                  <span className="pt-0.5 text-xl font-semibold tracking-tight">
                    finance
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
                className={
                  collapsed
                    ? "-ml-2 flex size-[30px] items-center justify-center rounded-full bg-card"
                    : "ml-auto flex size-[30px] shrink-0 items-center justify-center rounded-full bg-card"
                }
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </button>
            </div>
            <div className="flex justify-center px-3 pb-4"><FinancialPrivacyToggle compact={collapsed} /></div>
            {!collapsed && (
              <>
                <SidebarNavigation />
                <SidebarFooter user={user} demoMode={demoMode} />
              </>
            )}
          </div>
        </aside>

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
