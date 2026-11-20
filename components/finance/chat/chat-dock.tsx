"use client";

import { useContext } from "react";

import { ChatContext } from "@/components/finance/chat/chat-context";
import { ChatPanel } from "@/components/finance/chat/chat-panel";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useDesktopLayout } from "@/hooks/use-desktop-layout";

/** Docked beside the page from `lg` up, so questions can be asked while looking at a screen; a full-height sheet below. */
export function ChatDock() {
  const chat = useContext(ChatContext);
  const desktop = useDesktopLayout();
  if (!chat?.open) return null;
  const { open, setOpen } = chat;
  if (desktop) {
    return (
      <aside aria-label="Assistente" className="sticky top-2 my-2 mr-2 hidden h-[calc(100vh-1rem)] w-[380px] shrink-0 overflow-hidden rounded-[28px] border border-border bg-card shadow-elevation lg:block">
        <ChatPanel onClose={() => setOpen(false)} />
      </aside>
    );
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" showCloseButton={false} className="w-full max-w-none gap-0 p-0 sm:max-w-md">
        <SheetTitle className="sr-only">Assistente</SheetTitle>
        <SheetDescription className="sr-only">Converse sobre suas finanças.</SheetDescription>
        <ChatPanel onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
