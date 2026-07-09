"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ChartLine,
  ChartNoAxesCombined,
  ChevronRight,
  CreditCard,
  Menu,
  PiggyBank,
  ReceiptText,
  Repeat,
  Settings2,
  Target,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/transactions", label: "Lançamentos", icon: ReceiptText },
  { href: "/credit-card", label: "Cartão", icon: CreditCard },
  { href: "/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/projected-balance", label: "Saldo Projetado", icon: ChartLine },
  { href: "/investments", label: "Investimentos", icon: PiggyBank },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/settings", label: "Configurações", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildNavigationHref(targetPath: string) {
    const params = new URLSearchParams();
    const month = searchParams.get("month");

    if (month && ["/dashboard", "/transactions", "/credit-card", "/recurring"].includes(targetPath)) {
      params.set("month", month);
    }

    return params.size ? `${targetPath}?${params.toString()}` : targetPath;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_20%),linear-gradient(180deg,_#030712_0%,_#071428_48%,_#081a34_100%)] text-slate-100">
      <RecurringAutoGenerator />
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

            <nav className="mt-10 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={buildNavigationHref(item.href)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                      active
                        ? "bg-cyan-300 text-slate-950 shadow-lg"
                        : "text-slate-300 hover:bg-sky-400/10 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    <ChevronRight className="size-4 opacity-60" />
                  </Link>
                );
              })}
            </nav>
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
                <nav className="space-y-2 p-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={buildNavigationHref(item.href)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                          active
                            ? "bg-cyan-300 text-slate-950"
                            : "text-slate-200 hover:bg-sky-400/10 hover:text-white"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="size-4" />
                          {item.label}
                        </span>
                        <ArrowLeftRight className="size-4 opacity-0" />
                      </Link>
                    );
                  })}
                </nav>
              </DrawerContent>
            </Drawer>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
