"use client";

import type {
  FinanceCommandActionId,
  FinanceCommandIntent,
} from "@/lib/interfaces/finance-command";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function useFinanceCommandIntent(
  actions: readonly FinanceCommandActionId[],
  onIntent: (intent: FinanceCommandIntent) => void,
) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const command = searchParams.get("command");
  const commandId = searchParams.get("commandId");
  const onIntentRef = useRef(onIntent);
  const lastHandledId = useRef<string | null>(null);

  useEffect(() => {
    onIntentRef.current = onIntent;
  }, [onIntent]);

  useEffect(() => {
    if (!command) {
      lastHandledId.current = null;
      return;
    }
    if (!actions.includes(command as FinanceCommandActionId)) return;

    const intentId = commandId ?? command;
    if (lastHandledId.current === intentId) return;

    lastHandledId.current = intentId;
    onIntentRef.current({
      action: command as FinanceCommandActionId,
      id: intentId,
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("command");
    nextParams.delete("commandId");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [actions, command, commandId, pathname, router, searchParams]);
}
