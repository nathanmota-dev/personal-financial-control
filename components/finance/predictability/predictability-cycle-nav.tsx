import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PredictabilityCycleNavProps } from "@/app/interfaces/predictability";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";

export function PredictabilityCycleNav({ cycle }: PredictabilityCycleNavProps) {
  return (
    <nav aria-label="Ciclos" className="flex items-center gap-2">
      <Button asChild variant="secondary" size="icon" className="h-10 w-10">
        <Link href={`/predictability?cycle=${cycle.previousStart}`} aria-label="Ciclo anterior">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </Button>
      <p className="min-w-[150px] text-center text-sm font-semibold text-content-strong">
        {`${formatDateLabel(cycle.start)} – ${formatDateLabel(cycle.end)}`}
      </p>
      <Button asChild variant="secondary" size="icon" className="h-10 w-10">
        <Link href={`/predictability?cycle=${cycle.nextStart}`} aria-label="Próximo ciclo">
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </nav>
  );
}
