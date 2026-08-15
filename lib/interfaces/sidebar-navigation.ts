import type { LucideIcon } from "lucide-react";

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
};
