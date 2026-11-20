import { Button } from "@/components/ui/button";
import { CHAT_SUGGESTIONS } from "@/lib/chat/tool-labels";
import type { ChatEmptyStateProps } from "@/lib/interfaces/components/chat";

export function ChatEmptyState({ disabled, onPick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 px-1">
      <div>
        <p className="text-base font-semibold text-content-strong">Pergunte sobre suas finanças</p>
        <p className="mt-1 text-sm text-content-muted">Consulto seus lançamentos, orçamento, faturas e saldo. Não altero nenhum dado.</p>
      </div>
      <div className="flex flex-col gap-2">
        {CHAT_SUGGESTIONS.map((question) => (
          <Button key={question} type="button" variant="outline" disabled={disabled} className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => onPick(question)}>
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
