"use client";

import { SidebarFooter } from "@/components/finance/sidebar-footer";
import { SidebarNavigation } from "@/components/finance/sidebar-navigation";
import { Button } from "@/components/ui/button";
import {
Drawer,
DrawerContent,
DrawerDescription,
DrawerHeader,
DrawerTitle,
DrawerTrigger,
} from "@/components/ui/drawer";
import type { MobileNavigationProps } from "@/lib/interfaces/app-shell";
import { Menu } from "lucide-react";
import { useState } from "react";

export function MobileNavigation({ user, demoMode }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="Abrir menu">
          <Menu className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-r border-border bg-surface text-content-strong">
        <DrawerHeader className="border-b border-border text-left">
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription className="text-content">
            Selecione a área do app financeiro.
          </DrawerDescription>
        </DrawerHeader>
        <SidebarNavigation mobile onNavigate={closeMenu} />
        <SidebarFooter user={user} demoMode={demoMode} onNavigate={closeMenu} />
      </DrawerContent>
    </Drawer>
  );
}
