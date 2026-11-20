"use client";

import { MessageCircle } from "lucide-react";
import { useContext, useEffect, useRef } from "react";

import { ChatContext } from "@/components/finance/chat/chat-context";

/**
 * Floating button on the right that opens the chat. It hides while the chat is open and takes focus back when it closes.
 * Renders nothing outside a ChatProvider, so callers never need to check.
 */
export function ChatLauncher() {
  const chat = useContext(ChatContext);
  const open = chat?.open ?? false;
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (wasOpen.current && !open) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!chat || open) return null;
  return (
    <button
      ref={button}
      type="button"
      aria-label="Abrir assistente"
      onClick={() => chat.setOpen(true)}
      className="fixed bottom-4 right-4 z-40 inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevation transition-[background-color,transform] hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:bottom-6 lg:right-6 lg:size-14"
    >
      <MessageCircle className="size-5 lg:size-6" aria-hidden="true" />
    </button>
  );
}
