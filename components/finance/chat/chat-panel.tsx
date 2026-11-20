"use client";

import { MessageSquarePlus, X } from "lucide-react";

import { useChatPanel } from "@/components/finance/chat/chat-context";
import { ChatComposer } from "@/components/finance/chat/chat-composer";
import { ChatEmptyState } from "@/components/finance/chat/chat-empty-state";
import { ChatMessageList } from "@/components/finance/chat/chat-message-list";
import { ChatSetupNotice } from "@/components/finance/chat/chat-setup-notice";
import { useFinancialPrivacy } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import type { ChatPanelProps } from "@/lib/interfaces/components/chat";

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { availability, messages, busy, error, send, stop, reset } = useChatPanel();
  const { hidden } = useFinancialPrivacy();
  const ready = availability === "ready";
  const disabled = !ready || hidden;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4" data-testid="chat-panel">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-content-strong">Assistente</h2>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" aria-label="Nova conversa" disabled={!messages.length} onClick={reset}><MessageSquarePlus className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Fechar chat" onClick={onClose}><X className="size-4" /></Button>
        </div>
      </header>
      {!ready ? <ChatSetupNotice availability={availability} /> : messages.length ? <ChatMessageList messages={messages} busy={busy} /> : <ChatEmptyState disabled={disabled} onPick={send} />}
      {hidden && ready ? <p className="text-xs text-warning" role="status">Os valores estão ocultos. Reexiba-os para conversar.</p> : null}
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
      {ready ? <>
        <ChatComposer busy={busy} disabled={disabled} onSend={send} onStop={stop} />
        <p className="text-[0.7rem] text-content-muted">As perguntas e os dados consultados são enviados ao provedor de IA configurado.</p>
      </> : null}
    </div>
  );
}
