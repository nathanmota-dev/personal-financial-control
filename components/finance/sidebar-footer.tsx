"use client";

import { UserControls } from "@/components/auth/user-controls";
import type { SidebarFooterProps } from "@/lib/interfaces/sidebar-navigation";
import { cn } from "@/lib/utils";
import { CircleHelp,Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarFooter({ user, demoMode, onNavigate }: SidebarFooterProps) {
  const pathname = usePathname();
  return (
    <div className="shrink-0 pl-5 pr-4 pb-5 pt-4">
      <Link
        href="/settings"
        onClick={onNavigate}
        aria-current={pathname === "/settings" ? "page" : undefined}
        className={cn("flex h-[42px] items-center gap-[11px] rounded-lg px-[9px] text-sm hover:bg-sidebar-accent", pathname === "/settings" ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" : "text-sidebar-foreground")}
      >
        <Settings className="size-[18px]" />
        Configurações
      </Link>
      <Link
        href="/help"
        onClick={onNavigate}
        aria-current={pathname === "/help" ? "page" : undefined}
        className={cn(
          "flex h-[42px] items-center gap-[11px] rounded-lg px-[9px] text-sm hover:bg-sidebar-accent",
          pathname === "/help"
            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
            : "text-sidebar-foreground",
        )}
      >
        <CircleHelp className="size-[18px]" />
        Ajuda
      </Link>
      <div className="mt-4 border-t border-border pt-[19px]">
        <UserControls user={user} demoMode={demoMode} expanded />
      </div>
    </div>
  );
}
