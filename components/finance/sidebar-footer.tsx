"use client";

import { UserControls } from "@/components/auth/user-controls";
import type { SidebarFooterProps } from "@/lib/interfaces/sidebar-navigation";
import { FINANCE_UTILITY_NAVIGATION } from "@/lib/finance-navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarFooter({ user, demoMode, onNavigate }: SidebarFooterProps) {
  const pathname = usePathname();
  return (
    <div className="shrink-0 pl-5 pr-4 pb-5 pt-4">
      {FINANCE_UTILITY_NAVIGATION.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[42px] items-center gap-[11px] rounded-lg px-[9px] text-sm hover:bg-sidebar-accent",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                : "text-sidebar-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-border pt-[19px]">
        <UserControls user={user} demoMode={demoMode} expanded />
      </div>
    </div>
  );
}
