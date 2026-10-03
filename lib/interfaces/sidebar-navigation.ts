import type { LucideIcon } from "lucide-react";
import type { UserControlsProps } from "@/lib/interfaces/auth";

export type SidebarNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: Array<{
    href: string;
    label: string;
  }>;
};

export type SidebarNavigationProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export type SidebarFooterProps = UserControlsProps &
  Pick<SidebarNavigationProps, "onNavigate">;
