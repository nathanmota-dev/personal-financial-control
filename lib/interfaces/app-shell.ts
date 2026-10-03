import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/interfaces/auth";

export interface AppShellProps {
  children: ReactNode;
  demoMode: boolean;
  user: SessionUser;
}

export interface FinanceLayoutProps {
  children: ReactNode;
}

export type MobileNavigationProps = Pick<AppShellProps, "user" | "demoMode">;
