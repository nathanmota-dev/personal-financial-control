"use client";

import { usePathname } from "next/navigation";
import { FinanceSkeleton } from "./finance-skeleton";
import { FINANCE_ROUTE_SKELETONS } from "./route-skeletons";

/** Picks the skeleton of the route being opened, for loading states rendered outside the route segment. */
export function FinanceRouteSkeleton() {
  const pathname = usePathname() ?? "";
  const match = FINANCE_ROUTE_SKELETONS
    .filter(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((left, right) => right.prefix.length - left.prefix.length)[0];
  const Skeleton = match?.Skeleton ?? FinanceSkeleton;
  return <Skeleton />;
}
