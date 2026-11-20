"use client";

import { MessageCircle } from "lucide-react";
import { useContext } from "react";

import { ChatContext } from "@/components/finance/chat/chat-context";
import type { ChatTriggerProps } from "@/lib/interfaces/components/chat";
import { cn } from "@/lib/utils";

/** Renders nothing outside a ChatProvider (demo mode), so callers never need to check. */
export function ChatTrigger({ className, compact = false }: ChatTriggerProps) {
  const chat = useContext(ChatContext);
  if (!chat) return null;
  return (
    <button
      type="button"
      aria-label="Abrir assistente"
      aria-pressed={chat.open}
      onClick={chat.toggle}
      className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-content-muted transition-colors hover:bg-sidebar-accent hover:text-content-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand", compact ? "size-9" : "h-9 px-2.5 text-sm", className)}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      {compact ? null : <span>Assistente</span>}
    </button>
  );
}
