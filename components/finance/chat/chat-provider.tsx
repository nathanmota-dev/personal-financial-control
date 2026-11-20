"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ChatContext } from "@/components/finance/chat/chat-context";
import type { ChatAvailability, ChatPanelState, ChatProviderProps } from "@/lib/interfaces/components/chat";

const endpoint = "/api/ai/chat";
const transport = new DefaultChatTransport({ api: endpoint });

async function loadAvailability(): Promise<ChatAvailability> {
  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) return "unavailable";
    return (await response.json()).configured ? "ready" : "unconfigured";
  } catch {
    return "unavailable";
  }
}

/**
 * Conversation state lives only in memory: reloading the page starts a new one, so no financial text is stored.
 * Mounted inside the shell, which only renders after sign-in and PIN. Demo mode has no AI provider, so the chat opens
 * straight on the setup notice and never calls the API.
 */
export function ChatProvider({ demoMode, children }: ChatProviderProps) {
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState<ChatAvailability>(demoMode ? "unconfigured" : "loading");
  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({ transport });

  useEffect(() => {
    if (demoMode || !open || availability === "ready") return;
    let active = true;
    loadAvailability().then((next) => { if (active) setAvailability(next); });
    return () => { active = false; };
  }, [demoMode, open, availability]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) void sendMessage({ text: trimmed });
  }, [sendMessage]);
  const reset = useCallback(() => { stop(); setMessages([]); clearError(); }, [stop, setMessages, clearError]);

  const value = useMemo<ChatPanelState>(() => ({
    open, setOpen, availability, messages, send, stop, reset,
    busy: status === "submitted" || status === "streaming",
    error: error ? "Não foi possível obter a resposta. Tente novamente." : null,
  }), [open, availability, messages, send, stop, reset, status, error]);

  return <ChatContext value={value}>{children}</ChatContext>;
}
