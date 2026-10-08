"use client";

import { AccountPreferences } from "@/components/auth/account-preferences";
import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { Avatar,AvatarFallback,AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
Popover,
PopoverContent,
PopoverTrigger,
} from "@/components/ui/popover";
import type { UserControlsProps } from "@/lib/interfaces/auth";
import { Ellipsis } from "lucide-react";

export function UserControls({
  user,
  demoMode,
  expanded = false,
}: UserControlsProps) {
  const names = user.name.trim().split(/\s+/);
  const initials =
    (Array.from(names[0] ?? "")[0] ?? "U") +
    (names.length > 1 ? (Array.from(names[names.length - 1])[0] ?? "") : "");

  return (
    <div
      className={
        expanded
          ? "flex items-center justify-between gap-[9px] pl-[5px]"
          : "flex items-center justify-between gap-3"
      }
      role="group"
      aria-label="Conta e preferências"
    >
      <Avatar
        data-user-content
        size="lg"
        className={expanded ? "size-9" : undefined}
        title={user.name}
      >
        <AvatarImage
          src={user.photoURL ?? undefined}
          alt={`Foto de ${user.name}`}
          referrerPolicy="no-referrer"
        />
        <AvatarFallback
          className="bg-brand/15 font-semibold text-brand"
          aria-label={user.name}
        >
          {initials.toLocaleUpperCase("pt-BR")}
        </AvatarFallback>
      </Avatar>
      {expanded ? (
        <>
          <div className="min-w-0 flex-1">
            <p data-user-content className="truncate text-sm font-semibold">{names[0]}</p>
            <p data-user-content className="mt-0.5 truncate text-xs text-content-subtle" title={user.email ?? undefined}>
              {user.email}
            </p>
          </div>
          <FinancialPrivacyToggle compact />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Abrir preferências da conta"
              >
                <Ellipsis className="size-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-4" align="end" collisionPadding={8}>
              <AccountPreferences user={user} demoMode={demoMode} />
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!demoMode && <LogoutButton iconOnly />}
        </div>
      )}
    </div>
  );
}
