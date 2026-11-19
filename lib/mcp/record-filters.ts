import { matchesTextSearch } from "@/lib/text-search";
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

/** Filters shared by the listing tools; the description is encrypted at rest, so they run after loading. */
export const recordFilterFields = {
  fromDate: isoDate.optional(),
  toDate: isoDate.optional(),
  search: z.string().trim().min(1).max(200).optional(),
  uncategorized: z.boolean().optional(),
};

export type RecordFilters = { fromDate?: string; toDate?: string; search?: string };

export function matchesRecordFilters(record: { date: string; description: string }, { fromDate, toDate, search }: RecordFilters) {
  if (fromDate && record.date < fromDate) return false;
  if (toDate && record.date > toDate) return false;
  return matchesTextSearch(record.description, search);
}
