import { Button } from "@/components/ui/button";
import type { ReportViewLoadingProps } from "@/lib/interfaces/reports";

export function ReportViewLoading({ error, retry }: ReportViewLoadingProps) {
  return <div role={error ? "alert" : "status"} className="rounded-[20px] border border-border bg-card px-[22px] py-6 text-[13px] text-content">
    {error ? <><p>Não foi possível carregar esta visualização.</p><Button variant="outline" className="mt-3" onClick={retry}>Tentar novamente</Button></> : "Carregando dados do relatório…"}
  </div>;
}
