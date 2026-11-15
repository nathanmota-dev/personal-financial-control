import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BackButtonProps } from "@/lib/interfaces/back-button";

export function BackButton({ href, label = "Voltar", onClick }: BackButtonProps) {
  return (
    <Button asChild variant="outline" size="icon-lg">
      <Link href={href} aria-label={label} title={label} onClick={onClick}>
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
