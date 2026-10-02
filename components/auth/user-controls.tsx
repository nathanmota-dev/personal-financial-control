"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserControlsProps } from "@/lib/interfaces/auth";

export function UserControls({ user }: UserControlsProps) {
  const names = user.name.trim().split(/\s+/);
  const initials = (Array.from(names[0] ?? "")[0] ?? "U") +
    (names.length > 1 ? Array.from(names[names.length - 1])[0] ?? "" : "");

  return (
    <div className="flex items-center justify-between gap-3" role="group" aria-label="Conta e preferências">
      <Avatar size="lg" title={user.name}>
        <AvatarImage src={user.photoURL ?? undefined} alt={`Foto de ${user.name}`} referrerPolicy="no-referrer" />
        <AvatarFallback className="bg-brand/15 font-semibold text-brand" aria-label={user.name}>
          {initials.toLocaleUpperCase("pt-BR")}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LogoutButton iconOnly />
      </div>
    </div>
  );
}
