import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { RouteStatus } from "@/components/finance/route-status";
import { Button } from "@/components/ui/button";
import type { NotFoundStatusProps } from "@/lib/interfaces/finance-presentation";
import { ROUTE_STATUS_BUTTON_CLASS, ROUTE_STATUS_ILLUSTRATIONS } from "@/lib/route-status";

export function NotFoundStatus({ fullScreen = false }: NotFoundStatusProps) {
  return (
    <RouteStatus
      fullScreen={fullScreen}
      illustrationSrc={ROUTE_STATUS_ILLUSTRATIONS.notFound}
      code="404"
      title="Página não encontrada"
      description="O endereço pode ter mudado, ou o registro que você procurava foi excluído. Use a busca (Ctrl K) ou volte ao Dashboard."
      actions={<Button asChild className={ROUTE_STATUS_BUTTON_CLASS}><Link href="/dashboard"><LayoutDashboard className="size-[17px]" />Ir para o Dashboard</Link></Button>}
    />
  );
}
