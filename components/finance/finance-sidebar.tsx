"use client";

import { SidebarFooter } from "@/components/finance/sidebar-footer";
import { SidebarNavigation } from "@/components/finance/sidebar-navigation";
import { FinanceCommandTrigger } from "@/components/finance/finance-command-trigger";
import type { FinanceSidebarProps } from "@/lib/interfaces/app-shell";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";

export function FinanceSidebar({
  collapsed,
  demoMode,
  user,
  onToggleCollapsed,
  onOpenCommandPalette,
}: FinanceSidebarProps) {
  return (
    <aside
      className={
        collapsed
          ? "hidden w-[64px] shrink-0 bg-sidebar lg:block"
          : "hidden w-[238px] shrink-0 bg-sidebar lg:block"
      }
    >
      <div className="sticky top-0 flex h-dvh max-h-[1056px] flex-col">
        <div
          className={
            collapsed
              ? "flex shrink-0 flex-col items-center gap-3 px-2 pb-[22px] pt-6"
              : "flex h-[82px] shrink-0 items-start gap-[11px] pl-6 pr-[14px] pt-6"
          }
        >
          {!collapsed && (
            <>
              <Image
                src="/icon.png"
                width={30}
                height={30}
                sizes="30px"
                alt=""
                className="size-[30px] shrink-0 rounded-[7px] object-contain"
              />
              <span className="pt-0.5 text-xl font-semibold tracking-tight">
                finance
              </span>
            </>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            className={
              collapsed
                ? "flex size-[30px] items-center justify-center rounded-full bg-card"
                : "ml-auto flex size-[30px] shrink-0 items-center justify-center rounded-full bg-card"
            }
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
          {collapsed ? (
            <FinanceCommandTrigger
              compact
              onOpen={onOpenCommandPalette}
              className="size-[30px] bg-card"
            />
          ) : null}
        </div>
        <SidebarNavigation collapsed={collapsed} onOpenCommandPalette={onOpenCommandPalette} />
        <SidebarFooter collapsed={collapsed} user={user} demoMode={demoMode} />
      </div>
    </aside>
  );
}
