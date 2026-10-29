"use client";

import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { generateRecurringTransactionsAction } from "@/app/actions/finance";
import { DEMO_REFERENCE_MONTH } from "@/lib/demo/constants";
import {
extractErrorMessage,
formatMonthLabel,
getDefaultMonth,
isValidMonth,
} from "@/lib/finance-ui";
import {
claimRecurringGeneration,
finishRecurringGeneration,
} from "@/lib/recurring-generation-session";

const autoGeneratePaths = new Set(["/dashboard", "/transactions", "/recurring"]);

export function RecurringAutoGenerator({ demoMode }: { demoMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const month = isValidMonth(monthParam)
    ? monthParam
    : demoMode
      ? DEMO_REFERENCE_MONTH
      : getDefaultMonth();

  useEffect(() => {
    if (!autoGeneratePaths.has(pathname)) {
      return;
    }

    const claim = claimRecurringGeneration(month);
    if (claim === null) {
      return;
    }

    let succeeded = false;

    generateRecurringTransactionsAction(month)
      .then((result) => {
        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }

        succeeded = true;

        if (!result.data.length) {
          return;
        }

        toast.success(
          `${result.data.length} ${result.data.length === 1 ? "recorrência gerada" : "recorrências geradas"} para ${formatMonthLabel(month)}.`
        );
        router.refresh();
      })
      .catch((error) => {
        toast.error(extractErrorMessage(error));
      })
      .finally(() => {
        finishRecurringGeneration(month, claim, succeeded);
      });
  }, [month, pathname, router]);

  return null;
}
