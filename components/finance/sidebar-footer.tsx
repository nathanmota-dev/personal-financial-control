"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bell, CircleHelp, Settings } from "lucide-react";
import { UserControls } from "@/components/auth/user-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UserControlsProps } from "@/lib/interfaces/auth";

export function SidebarFooter({ user, demoMode }: UserControlsProps) {
  const pathname = usePathname();
  return (
    <div className="shrink-0 pl-5 pr-4 pb-5 pt-4">
      <Dialog>
        <DialogTrigger className="flex h-[42px] w-full items-center gap-[11px] rounded-lg px-[9px] text-sm text-sidebar-foreground hover:bg-sidebar-accent">
          <Bell className="size-[18px]" />
          Notificações
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>
            <DialogDescription>
              Consulte os próximos compromissos em Recorrentes e Saldo
              Projetado.
            </DialogDescription>
          </DialogHeader>
          <Link className="text-sm text-brand underline" href="/recurring">
            Ver compromissos recorrentes
          </Link>
        </DialogContent>
      </Dialog>
      <Link
        href="/settings"
        aria-current={pathname === "/settings" ? "page" : undefined}
        className={cn("flex h-[42px] items-center gap-[11px] rounded-lg px-[9px] text-sm hover:bg-sidebar-accent", pathname === "/settings" ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" : "text-sidebar-foreground")}
      >
        <Settings className="size-[18px]" />
        Configurações
      </Link>
      <Dialog>
        <DialogTrigger className="flex h-[42px] w-full items-center gap-[11px] rounded-lg px-[9px] text-sm text-sidebar-foreground hover:bg-sidebar-accent">
          <CircleHelp className="size-[18px]" />
          Ajuda
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como usar o Finance</DialogTitle>
            <DialogDescription>
              Cadastre suas contas e categorias. Registre receitas e despesas em
              Lançamentos e acompanhe o resultado no Dashboard. Use o seletor de
              mês para consultar outro período.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <div className="mt-4 border-t border-border pt-[19px]">
        <UserControls user={user} demoMode={demoMode} expanded />
      </div>
    </div>
  );
}
