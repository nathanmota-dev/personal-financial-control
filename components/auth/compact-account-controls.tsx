"use client";

import { UserRound } from "lucide-react";
import { AccountPreferences } from "@/components/auth/account-preferences";
import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UserControlsProps } from "@/lib/interfaces/auth";

export function CompactAccountControls({ user, demoMode }: UserControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <FinancialPrivacyToggle compact />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir preferências da conta" title="Conta e preferências">
            <UserRound className="size-[18px]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" collisionPadding={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-4">
          <AccountPreferences user={user} demoMode={demoMode} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
