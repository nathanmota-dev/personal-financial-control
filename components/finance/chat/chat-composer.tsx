"use client";

import { SendHorizontal, Square } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatComposerProps } from "@/lib/interfaces/components/chat";

export function ChatComposer({ busy, disabled, onSend, onStop }: ChatComposerProps) {
  const [text, setText] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (busy || disabled || !text.trim()) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        maxLength={2000}
        rows={1}
        aria-label="Mensagem"
        placeholder="Pergunte sobre seus gastos…"
        className="max-h-32 min-h-10 resize-none"
      />
      {busy ? (
        <Button type="button" size="icon" variant="outline" aria-label="Parar resposta" onClick={onStop}><Square className="size-4" /></Button>
      ) : (
        <Button type="submit" size="icon" aria-label="Enviar" disabled={disabled || !text.trim()}><SendHorizontal className="size-4" /></Button>
      )}
    </form>
  );
}
