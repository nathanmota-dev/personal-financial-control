"use client";

import {
  FlaskConical,
  Menu,
} from "lucide-react";

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

export function AppShell({
  children,
  demoMode,
  user,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-app-shell text-content-strong">
      <RecurringAutoGenerator demoMode={demoMode} />
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 flex h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-[2rem] border border-brand/40 bg-sidebar-shell px-6 py-7 text-content-strong shadow-[0_24px_80px_rgb(var(--surface-rgb) / .55)]">
            <div className="shrink-0 space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-brand">
                Controle Financeiro
              </p>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  Controle diário sem depender da planilha
                </h2>
              </div>
            </div>

            <SidebarNavigation />
            <div className="mt-4 shrink-0 border-t border-border pt-4">
              <UserControls user={user} />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex items-center justify-between gap-2 rounded-[1.75rem] border border-border bg-surface/75 px-4 py-3 shadow-[0_18px_50px_rgb(var(--surface-rgb) / .35)] backdrop-blur md:px-6 lg:hidden">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand sm:text-[0.72rem] sm:tracking-[0.32em]">
                Controle Financeiro
              </p>
              <p className="hidden text-sm text-content sm:block">Navegação principal</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <UserControls user={user} />
              <Drawer direction="left">
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Abrir menu">
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
                    Demo Mode
                  </span>
                  <p className="text-sm text-warning/80">
                    Dados simulados para apresentação do produto.
                  </p>
                </div>
                <p className="text-xs text-warning/60 sm:text-right">
                  Alterações são temporárias nesta instância.
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
