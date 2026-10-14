import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BackButtonProps } from "@/lib/interfaces/back-button";

export function BackButton({ href, label = "Voltar" }: BackButtonProps) {
  return (
    <Button asChild variant="outline" size="icon-lg">
      <Link href={href} aria-label={label} title={label}>
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
