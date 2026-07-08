"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { generateRecurringTransactionsAction } from "@/app/actions/finance";
import {
  extractErrorMessage,
  formatMonthLabel,
  getDefaultMonth,
  isValidMonth,
} from "@/lib/finance-ui";

const autoGeneratePaths = new Set(["/dashboard", "/transactions", "/recurring"]);
const pendingMonths = new Set<string>();

export function RecurringAutoGenerator() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const month = isValidMonth(monthParam) ? monthParam : getDefaultMonth();

  useEffect(() => {
    if (!autoGeneratePaths.has(pathname) || pendingMonths.has(month)) {
      return;
    }

    pendingMonths.add(month);

    generateRecurringTransactionsAction(month)
      .then((created) => {
        if (!created.length) {
          return;
        }

        toast.success(
          `${created.length} ${created.length === 1 ? "recorrência gerada" : "recorrências geradas"} para ${formatMonthLabel(month)}.`
        );
        router.refresh();
      })
      .catch((error) => {
        toast.error(extractErrorMessage(error));
      })
      .finally(() => {
        pendingMonths.delete(month);
      });
  }, [month, pathname, router]);

  return null;
}
