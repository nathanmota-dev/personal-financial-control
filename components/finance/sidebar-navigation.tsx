"use client";

import { FinanceCommandTrigger } from "@/components/finance/finance-command-trigger";
import { SidebarNavigationLinks } from "@/components/finance/sidebar-navigation-links";
import type { SidebarNavigationProps } from "@/lib/interfaces/sidebar-navigation";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SidebarNavigation({
  mobile = false,
  collapsed = false,
  onNavigate,
  onOpenCommandPalette,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto pl-4 pr-[14px]",
        mobile && "py-4",
        collapsed && "px-2",
      )}
    >
      {!collapsed && <div className="ml-1 mr-0.5 mb-[22px] flex h-[38px] items-center gap-2 rounded-[11px] bg-card px-3 text-content-muted">
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <input
          aria-label="Buscar páginas"
          placeholder="Buscar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-content-muted"
        />
        {onOpenCommandPalette ? (
          <FinanceCommandTrigger
            compact
            showShortcut
            onOpen={onOpenCommandPalette}
            className="shrink-0 border border-border/70"
          />
        ) : null}
      </div>}
      <SidebarNavigationLinks
        pathname={pathname}
        month={searchParams.get("month")}
        collapsed={collapsed}
        query={collapsed ? "" : query}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
