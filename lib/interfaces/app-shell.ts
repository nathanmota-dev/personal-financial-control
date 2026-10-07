import type { SessionUser } from "@/lib/interfaces/auth";
import type { ReactNode } from "react";

export interface AppShellProps {
  children: ReactNode;
  demoMode: boolean;
  user: SessionUser;
}

export type FinanceSidebarProps = Pick<AppShellProps, "demoMode" | "user"> & {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenCommandPalette: () => void;
};

export interface FinanceLayoutProps {
  children: ReactNode;
}

export type MobileNavigationProps = Pick<AppShellProps, "user" | "demoMode">;
