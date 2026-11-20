import { ChatMarkdown } from "@/components/finance/chat/chat-markdown";
import { ChatToolStatus } from "@/components/finance/chat/chat-tool-status";
import type { ChatMessageProps } from "@/lib/interfaces/components/chat";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: ChatMessageProps) {
  const fromUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1.5", fromUser ? "items-end" : "items-start")}>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          if (!part.text) return null;
          return fromUser ? (
            <p key={index} className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground">{part.text}</p>
          ) : (
            <div key={index} className="max-w-[90%] rounded-2xl bg-muted px-3.5 py-2 text-sm text-content-strong"><ChatMarkdown text={part.text} /></div>
          );
        }
        if (part.type.startsWith("tool-")) {
          const state = (part as { state?: string }).state;
          return <ChatToolStatus key={index} toolName={part.type.slice(5)} done={state === "output-available"} failed={state === "output-error"} />;
        }
        return null;
      })}
    </div>
  );
}
