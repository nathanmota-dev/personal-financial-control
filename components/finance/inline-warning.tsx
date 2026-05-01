import { AlertTriangle } from "lucide-react";

export function InlineWarning({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p className="leading-6">{message}</p>
    </div>
  );
}
