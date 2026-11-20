"use client";

import { useEffect, useRef } from "react";

import { ChatMessage } from "@/components/finance/chat/chat-message";
import type { ChatMessageListProps } from "@/lib/interfaces/components/chat";

export function ChatMessageList({ messages, busy }: ChatMessageListProps) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [messages, busy]);
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-1" role="log" aria-live="polite" aria-label="Conversa">
      {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
      {busy && messages.at(-1)?.role === "user" ? <p className="text-xs text-content-muted" role="status">Pensando…</p> : null}
      <div ref={end} />
    </div>
  );
}
