import type { DatedMovement } from "@/lib/interfaces/finance-utils";

export function sortDatedMovements<T extends DatedMovement>(movements: T[]) {
  return [...movements].sort((left, right) =>
    left.date.localeCompare(right.date) ||
    (left.createdAt ?? "").localeCompare(right.createdAt ?? "") ||
    left.id.localeCompare(right.id),
  );
}
