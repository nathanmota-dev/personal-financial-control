"use client";

import { Ellipsis } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserControlsProps } from "@/lib/interfaces/auth";

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
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-content-subtle">
              {demoMode ? "Conta demonstração" : "Conta pessoal"}
            </p>
          </div>
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
            <PopoverContent className="w-52" align="end">
              <p className="mb-3 text-sm font-medium">Conta e preferências</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-content">Tema</span>
                <ThemeToggle />
              </div>
              {!demoMode && (
                <div className="mt-3">
                  <LogoutButton />
                </div>
              )}
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
