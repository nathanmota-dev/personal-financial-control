import Link from "next/link";

import type { ChatAvailability } from "@/lib/interfaces/components/chat";

export function ChatSetupNotice({ availability }: { availability: ChatAvailability }) {
  if (availability === "loading") return <p className="text-sm text-content-muted" role="status">Verificando a configuração de IA…</p>;
  if (availability === "unavailable") return <p className="text-sm text-content-muted" role="status">O chat não está disponível agora.</p>;
  return (
    <div className="flex flex-1 flex-col justify-center gap-2 px-1">
      <p className="text-base font-semibold text-content-strong">Configure uma IA para usar o chat</p>
      <p className="text-sm text-content-muted">Informe a API key do seu provedor em <Link href="/settings" className="font-medium text-brand underline-offset-2 hover:underline">Configurações → IA</Link>.</p>
    </div>
  );
}
