import type { UIMessage } from "ai";
import type { ReactNode } from "react";

export type ChatAvailability = "loading" | "ready" | "unconfigured" | "unavailable";

export type ChatPanelState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  availability: ChatAvailability;
  messages: UIMessage[];
  busy: boolean;
  error: string | null;
  send: (text: string) => void;
  stop: () => void;
  reset: () => void;
};

export type ChatProviderProps = { demoMode: boolean; children: ReactNode };

export type ChatMessageProps = { message: UIMessage };

export type ChatMessageListProps = { messages: UIMessage[]; busy: boolean };

export type ChatComposerProps = { busy: boolean; disabled: boolean; onSend: (text: string) => void; onStop: () => void };

export type ChatEmptyStateProps = { disabled: boolean; onPick: (question: string) => void };

export type ChatToolStatusProps = { toolName: string; done: boolean; failed: boolean };

export type ChatMarkdownProps = { text: string };

export type ChatPanelProps = { onClose: () => void };
