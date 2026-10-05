import { Button } from "@/components/ui/button";
import type { ReportViewLoadingProps } from "@/lib/interfaces/reports";

export function ReportViewLoading({ error, retry }: ReportViewLoadingProps) {
  return <div role={error ? "alert" : "status"} className="rounded-2xl border border-border bg-card p-6 text-sm text-content">
    {error ? <><p>Não foi possível carregar esta visualização.</p><Button variant="outline" className="mt-3" onClick={retry}>Tentar novamente</Button></> : "Carregando dados do relatório…"}
  </div>;
}
