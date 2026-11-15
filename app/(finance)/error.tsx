"use client";

import { LayoutDashboard, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { RouteStatus } from "@/components/finance/route-status";
import { Button } from "@/components/ui/button";
import type { RouteErrorProps } from "@/lib/interfaces/finance-presentation";
import { describeRouteError, ROUTE_STATUS_BUTTON_CLASS, ROUTE_STATUS_ILLUSTRATIONS } from "@/lib/route-status";

export default function Error({ error, retry }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const { message, digest } = describeRouteError(error);

  return (
    <RouteStatus
      illustrationSrc={ROUTE_STATUS_ILLUSTRATIONS.error}
      code="Ops"
      title="Não foi possível carregar esta tela"
      description="Pode ser uma instabilidade momentânea na conexão ou no banco de dados. Seus dados continuam salvos."
      details={<p className="break-words">{message}{digest ? <> · <span className="font-mono">{digest}</span></> : null}</p>}
      actions={
        <>
          <Button className={ROUTE_STATUS_BUTTON_CLASS} onClick={() => retry()}><RotateCcw className="size-[17px]" />Tentar novamente</Button>
          <Button asChild variant="secondary" className={ROUTE_STATUS_BUTTON_CLASS}><Link href="/dashboard"><LayoutDashboard className="size-[17px]" />Ir para o Dashboard</Link></Button>
        </>
      }
    />
  );
}
