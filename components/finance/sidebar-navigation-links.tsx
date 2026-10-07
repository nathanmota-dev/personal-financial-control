"use client";

import { cn } from "@/lib/utils";
import { normalizeFinanceCommandSearch } from "@/lib/finance-command-catalog";
import { FINANCE_NAVIGATION } from "@/lib/finance-navigation";
import { isValidMonth } from "@/lib/finance-ui";
import type { SidebarNavigationLinksProps } from "@/lib/interfaces/sidebar-navigation";
import Link from "next/link";

function navigationHref(path: string, month: string | null) {
  const monthlyRoutes = [
    "/dashboard",
    "/transactions",
    "/credit-card",
    "/recurring",
    "/budgets",
  ];
  return isValidMonth(month) && monthlyRoutes.includes(path)
    ? `${path}?${new URLSearchParams({ month })}`
    : path;
}

export function SidebarNavigationLinks({
  pathname,
  month,
  query,
  onNavigate,
}: SidebarNavigationLinksProps) {
  const normalizedQuery = normalizeFinanceCommandSearch(query);

  return (
    <>
      {FINANCE_NAVIGATION.map((item, index) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const searchableText = normalizeFinanceCommandSearch(
          `${item.label} ${item.aliases?.join(" ") ?? ""} ${item.children
            ?.map((child) => `${child.label} ${child.aliases?.join(" ") ?? ""}`)
            .join(" ") ?? ""}`,
        );
        if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
          return null;
        }

        const children = item.children?.filter((child) => {
          if (!normalizedQuery) return true;
          return normalizeFinanceCommandSearch(
            `${child.label} ${child.aliases?.join(" ") ?? ""}`,
          ).includes(normalizedQuery);
        });

        return (
          <div key={item.href}>
            {index === 5 && !query && (
              <p className="mb-[11px] mt-[12px] px-[13px] text-xs text-content-subtle">
                Análise
              </p>
            )}
            <Link
              href={navigationHref(item.href, month)}
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
            {item.children && (active || query) && children?.length ? (
              <div className="mb-2 ml-[22px] border-l border-border pl-3">
                {children.map((child) => (
                  <Link
                    key={child.href}
                    href={navigationHref(child.href, month)}
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
            ) : null}
          </div>
        );
      })}
    </>
  );
}
