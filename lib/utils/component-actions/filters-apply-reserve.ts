import {
centsToMoneyInput,
moneyInputToCents
} from "@/lib/finance-ui";
import type { ProjectionFiltersApplyReserveContext } from "@/lib/interfaces/component-actions/filters-apply-reserve";

export function ProjectionFiltersApplyReserve({ updateFilters, reserveInput, setReserveInput, filters }: ProjectionFiltersApplyReserveContext) {
    try {
      updateFilters({
        minimumReserveCents: moneyInputToCents(reserveInput || "0"),
      });
    } catch {
      setReserveInput(centsToMoneyInput(filters.minimumReserveCents));
    }
  }
