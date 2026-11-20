import { Check, Loader2, TriangleAlert } from "lucide-react";

import { chatToolLabel } from "@/lib/chat/tool-labels";
import type { ChatToolStatusProps } from "@/lib/interfaces/components/chat";

export function ChatToolStatus({ toolName, done, failed }: ChatToolStatusProps) {
  const Icon = failed ? TriangleAlert : done ? Check : Loader2;
  return (
    <p className="flex items-center gap-1.5 text-xs text-content-muted" role="status">
      <Icon className={done || failed ? "size-3.5" : "size-3.5 animate-spin"} aria-hidden="true" />
      {failed ? `Não consegui consultar ${chatToolLabel(toolName)}` : done ? `Consultei ${chatToolLabel(toolName)}` : `Consultando ${chatToolLabel(toolName)}…`}
    </p>
  );
}
