import type { UserControlsProps } from "@/lib/interfaces/auth";
import type { LucideIcon } from "lucide-react";

export type SidebarNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  aliases?: readonly string[];
  children?: Array<{
    href: string;
    label: string;
    aliases?: readonly string[];
  }>;
};

export type SidebarNavigationProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  onOpenCommandPalette?: () => void;
};

export type SidebarNavigationLinksProps = {
  pathname: string;
  month: string | null;
  query: string;
  onNavigate?: () => void;
};

export type SidebarFooterProps = UserControlsProps &
  Pick<SidebarNavigationProps, "onNavigate">;
