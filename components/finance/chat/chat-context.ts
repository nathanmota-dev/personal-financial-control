"use client";

import { createContext, useContext } from "react";

import type { ChatPanelState } from "@/lib/interfaces/components/chat";

export const ChatContext = createContext<ChatPanelState | null>(null);

export function useChatPanel() {
  const state = useContext(ChatContext);
  if (!state) throw new Error("useChatPanel must be used inside ChatProvider.");
  return state;
}
