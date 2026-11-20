import { ChatToolStatus } from "@/components/finance/chat/chat-tool-status";
import type { ChatMessageProps } from "@/lib/interfaces/components/chat";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: ChatMessageProps) {
  const fromUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1.5", fromUser ? "items-end" : "items-start")}>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return part.text ? (
            <p key={index} className={cn("max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm", fromUser ? "bg-primary text-primary-foreground" : "bg-muted text-content-strong")}>
              {part.text}
            </p>
          ) : null;
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
