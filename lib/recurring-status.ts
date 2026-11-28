import type { RecurringOccurrencesData } from "@/lib/interfaces/recurring-occurrences";

export function emptyRecurringOccurrences(month: string): RecurringOccurrencesData {
  return { month, byTemplate: {}, recordedKeys: [] };
}

/** The rule already happened in `month`: the app generated it or a real entry is linked to it. */
export function isRecurringRecorded(occurrences: Pick<RecurringOccurrencesData, "recordedKeys">, templateId: string, month: string) {
  return occurrences.recordedKeys.includes(`${templateId}:${month}`);
}
