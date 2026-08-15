"use client";

import {
  FlaskConical,
  Menu,
} from "lucide-react";

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
}: {
  children: React.ReactNode;
  demoMode: boolean;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_20%),linear-gradient(180deg,_#030712_0%,_#071428_48%,_#081a34_100%)] text-slate-100">
      <RecurringAutoGenerator demoMode={demoMode} />
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 md:p-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[2rem] border border-sky-900/40 bg-[linear-gradient(180deg,_rgba(2,6,23,0.95)_0%,_rgba(5,22,53,0.96)_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-sky-300">
                Controle Financeiro
              </p>
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  Controle diário sem depender da planilha
                </h2>
              </div>
            </div>

            <SidebarNavigation />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex items-center justify-between rounded-[1.75rem] border border-slate-800 bg-slate-950/75 px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.35)] backdrop-blur md:px-6 lg:hidden">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-sky-300">
                Controle Financeiro
              </p>
              <p className="text-sm text-slate-400">Navegação principal</p>
            </div>

            <Drawer direction="left">
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <Menu className="size-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="border-r border-slate-800 bg-slate-950 text-white">
                <DrawerHeader className="border-b border-slate-800 text-left">
                  <DrawerTitle>Menu</DrawerTitle>
                  <DrawerDescription className="text-slate-300">
                    Selecione a área do app financeiro.
                  </DrawerDescription>
                </DrawerHeader>
                <SidebarNavigation mobile />
              </DrawerContent>
            </Drawer>
          </header>

          <main className="flex-1">
            {demoMode ? (
              <div className="mb-6 flex flex-col gap-2 rounded-[1.5rem] border border-amber-400/25 bg-amber-400/10 px-5 py-4 text-amber-100 shadow-[0_18px_50px_rgba(2,6,23,0.2)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                    <FlaskConical className="size-3.5" />
                    Demo Mode
                  </span>
                  <p className="text-sm text-amber-100/80">
                    Dados simulados para apresentação do produto.
                  </p>
                </div>
                <p className="text-xs text-amber-100/60 sm:text-right">
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
