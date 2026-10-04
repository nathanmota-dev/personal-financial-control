import type { ProjectionFiltersUpdateFiltersContext } from "@/lib/interfaces/component-actions/filters-update-filters";

export function ProjectionFiltersUpdateFilters({ filters, startTransition, router, pathname }: ProjectionFiltersUpdateFiltersContext, next: Partial<typeof filters>) {
    const merged = {
      ...filters,
      ...next,
    };

    if (merged.accountId) {
      merged.includeCreditCard = false;
    }

    const params = new URLSearchParams();
    params.set("period", merged.period);
    params.set("startDate", merged.startDate);

    if (merged.period === "custom") {
      params.set("endDate", merged.endDate);
    }

    if (merged.accountId) {
      params.set("accountId", merged.accountId);
    }

    if (merged.minimumReserveCents > 0) {
      params.set("minimumReserveCents", String(merged.minimumReserveCents));
    }

    if (!merged.includeCreditCard) {
      params.set("includeCreditCard", "false");
    }

    if (!merged.includeInvestments) {
      params.set("includeInvestments", "false");
    }

    if (!merged.includeTransfers) {
      params.set("includeTransfers", "false");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }
