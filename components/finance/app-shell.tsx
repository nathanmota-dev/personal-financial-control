"use client";

import {
  FlaskConical,
  Menu,
  ChartPie,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useState } from "react";
import { SidebarFooter } from "@/components/finance/sidebar-footer";
import { UserControls } from "@/components/auth/user-controls";
import type { AppShellProps } from "@/lib/interfaces/app-shell";
import { SidebarNavigation } from "@/components/finance/sidebar-navigation";
import { RecurringAutoGenerator } from "@/components/finance/recurring-auto-generator";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
                  <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] bg-orange text-white">
                    <ChartPie className="size-[18px]" />
                  </span>
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
            {!collapsed && (
              <>
                <SidebarNavigation />
                <SidebarFooter user={user} demoMode={demoMode} />
              </>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-7 lg:pb-[106px] lg:pl-[29px] lg:pr-[55px] lg:pt-8">
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
              <UserControls user={user} demoMode={demoMode} />
              <Drawer direction="left">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Abrir menu"
                  >
                    <Menu className="size-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="border-r border-border bg-surface text-content-strong">
                  <DrawerHeader className="border-b border-border text-left">
                    <DrawerTitle>Menu</DrawerTitle>
                    <DrawerDescription className="text-content">
                      Selecione a área do app financeiro.
                    </DrawerDescription>
                  </DrawerHeader>
                  <SidebarNavigation mobile />
                  <SidebarFooter user={user} demoMode={demoMode} />
                </DrawerContent>
              </Drawer>
            </div>
          </header>

          <main className="flex-1">
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
