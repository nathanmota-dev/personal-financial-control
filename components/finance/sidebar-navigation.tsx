"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Calculator,
  ChartLine,
  ChartNoAxesCombined,
  ChevronRight,
  CreditCard,
  PiggyBank,
  ReceiptText,
  Repeat,
  Settings2,
  Target,
} from "lucide-react";

import type {
  SidebarNavigationItem,
  SidebarNavigationProps,
} from "@/lib/interfaces/sidebar-navigation";
import { cn } from "@/lib/utils";

const navigation: SidebarNavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { href: "/transactions", label: "Lançamentos", icon: ReceiptText },
  { href: "/credit-card", label: "Cartão", icon: CreditCard },
  { href: "/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/projected-balance", label: "Saldo Projetado", icon: ChartLine },
  {
    href: "/investments",
    label: "Investimentos",
    icon: PiggyBank,
    children: [
      { href: "/investments", label: "Visão geral" },
      { href: "/investments/portfolio", label: "Carteira de longo prazo" },
      { href: "/investments/emergency-reserve", label: "Reserva de emergência" },
    ],
  },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/calculators", label: "Calculadoras", icon: Calculator },
  { href: "/settings", label: "Configurações", icon: Settings2 },
];

export function SidebarNavigation({ mobile = false }: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildNavigationHref(targetPath: string) {
    const params = new URLSearchParams();
    const month = searchParams.get("month");

    if (
      month &&
      ["/dashboard", "/transactions", "/credit-card", "/recurring"].includes(targetPath)
    ) {
      params.set("month", month);
    }

    return params.size ? targetPath + "?" + params.toString() : targetPath;
  }

  return (
    <nav
      className={cn(
        "space-y-2",
        mobile ? "p-4" : "mt-10 min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar"
      )}
    >
      {navigation.map((item) => {
        const Icon = item.icon;
        const parentActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const hasChildren = Boolean(item.children?.length);

        return (
          <div key={item.href} className="space-y-1.5">
            <Link
              href={buildNavigationHref(item.href)}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                parentActive
                  ? "border-brand/70 bg-brand text-background shadow-lg"
                  : "border-border/60 text-content hover:border-brand/30 hover:bg-brand/10 hover:text-content-strong"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                {item.label}
              </span>
              <ChevronRight
                className={cn(
                  "size-4 opacity-60 transition-transform",
                  hasChildren && parentActive && "rotate-90"
                )}
              />
            </Link>

            {item.children ? (
              <div className="relative ml-5 space-y-1 pl-3 before:pointer-events-none before:absolute before:-top-1.5 before:bottom-4 before:left-0 before:border-l before:border-border/90 before:content-['']">
                {item.children.map((child) => {
                  const childActive = pathname === child.href;

                  return (
                    <Link
                      key={child.href}
                      href={buildNavigationHref(child.href)}
                      className={cn(
                        "relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition before:pointer-events-none before:absolute before:-left-3 before:top-0 before:h-1/2 before:w-3 before:rounded-bl-xl before:border-b before:border-l before:border-border/90 before:content-['']",
                        childActive
                          ? "bg-brand/12 font-semibold text-brand"
                          : "text-content-strong0 hover:bg-brand/8 hover:text-content-strong"
                      )}
                    >
                      <span>{child.label}</span>
                      {childActive ? (
                        <ArrowLeftRight className="size-3.5 rotate-90 opacity-70" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
