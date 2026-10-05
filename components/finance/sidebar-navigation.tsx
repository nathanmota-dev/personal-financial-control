"use client";

import type {
SidebarNavigationItem,
SidebarNavigationProps,
} from "@/lib/interfaces/sidebar-navigation";
import { cn } from "@/lib/utils";
import {
Calculator,
ChartNoAxesCombined,
CreditCard,
Landmark,
LayoutDashboard,
ListPlus,
Repeat2,
Search,
Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname,useSearchParams } from "next/navigation";
import { useState } from "react";

const navigation: SidebarNavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Lançamentos", icon: ListPlus },
  { href: "/credit-card", label: "Cartão", icon: CreditCard },
  { href: "/recurring", label: "Recorrentes", icon: Repeat2 },
  {
    href: "/projected-balance",
    label: "Saldo Projetado",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/investments",
    label: "Investimentos",
    icon: Landmark,
    children: [
      { href: "/investments", label: "Visão geral" },
      { href: "/investments/portfolio", label: "Carteira de longo prazo" },
      {
        href: "/investments/emergency-reserve",
        label: "Reserva de emergência",
      },
    ],
  },
  { href: "/reports", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/calculators", label: "Calculadoras", icon: Calculator },
];

export function SidebarNavigation({ mobile = false, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  function href(path: string) {
    const month = searchParams.get("month");
    return month &&
      ["/dashboard", "/transactions", "/credit-card", "/recurring"].includes(
        path,
      )
      ? `${path}?${new URLSearchParams({ month })}`
      : path;
  }
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto pl-4 pr-[14px]",
        mobile && "py-4",
      )}
    >
      <label className="ml-1 mr-0.5 mb-[22px] flex h-[38px] items-center gap-2 rounded-[11px] bg-card px-3 text-content-muted">
        <Search className="size-3.5 shrink-0" />
        <input
          aria-label="Buscar páginas"
          placeholder="Buscar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-content-muted"
        />
      </label>
      {navigation.map((item, index) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        if (
          query &&
          !`${item.label} ${item.children?.map((child) => child.label).join(" ") ?? ""}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR"))
        )
          return null;
        return (
          <div key={item.href}>
            {index === 4 && !query && (
              <p className="mb-[11px] mt-[12px] px-[13px] text-xs text-content-subtle">
                Análise
              </p>
            )}
            <Link
              href={href(item.href)}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mb-[5px] flex h-[39px] items-center gap-[11px] rounded-[11px] px-[13px] text-sm transition-colors hover:bg-sidebar-accent",
                active
                  ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground hover:bg-sidebar-primary"
                  : "text-sidebar-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.7} />
              {item.label}
            </Link>
            {item.children && (active || query) && (
              <div className="mb-2 ml-[22px] border-l border-border pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    aria-current={pathname === child.href ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-2 py-2 text-xs hover:bg-sidebar-accent",
                      pathname === child.href
                        ? "font-semibold text-brand"
                        : "text-content",
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
