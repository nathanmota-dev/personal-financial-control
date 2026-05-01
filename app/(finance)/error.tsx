"use client";

import { useEffect } from "react";

import { ErrorPanel } from "@/components/finance/error-panel";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <ErrorPanel title="Falha ao carregar a tela" message={error.message} />
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}
