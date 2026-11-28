import type {
  RecurringAutoLink,
  RecurringAutoLinkInput,
  RecurringMatchCandidate,
  RecurringMatchTemplate,
} from "@/lib/interfaces/recurring-occurrences";
import { addMonthsToMonth, buildDateInMonth } from "@/lib/utils/finance-month";

/** An automatic link needs the amount within 10% of the rule and the date within 7 days of its due date. */
export const AUTO_LINK_AMOUNT_TOLERANCE = 0.1;
export const AUTO_LINK_DAY_WINDOW = 7;

const DAY_MS = 86_400_000;

function dayDistance(left: string, right: string) {
  return Math.abs(Date.parse(`${left}T12:00:00Z`) - Date.parse(`${right}T12:00:00Z`)) / DAY_MS;
}

function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Dates whose entries may pay a rule of `month`: the whole month plus the matching window on both sides. */
export function recurringCandidateWindow(month: string) {
  const lastDay = shiftDate(`${addMonthsToMonth(month, 1)}-01`, -1);
  return { start: shiftDate(`${month}-01`, -AUTO_LINK_DAY_WINDOW), end: shiftDate(lastDay, AUTO_LINK_DAY_WINDOW) };
}

/** A card purchase pays an expense; every other entry must have the rule's own type. */
export function isCompatibleCandidate(template: Pick<RecurringMatchTemplate, "type">, candidate: Pick<RecurringMatchCandidate, "kind" | "type">) {
  return candidate.kind === "card" ? template.type === "expense" : candidate.type === template.type;
}

function amountGap(template: RecurringMatchTemplate, candidate: RecurringMatchCandidate) {
  return Math.abs(candidate.amountCents - template.amountCents) / Math.max(template.amountCents, 1);
}

export function isStrongMatch(template: RecurringMatchTemplate, candidate: RecurringMatchCandidate, month: string) {
  return (
    isCompatibleCandidate(template, candidate) &&
    candidate.categoryId === template.categoryId &&
    amountGap(template, candidate) <= AUTO_LINK_AMOUNT_TOLERANCE &&
    dayDistance(candidate.date, buildDateInMonth(month, template.dayOfMonth)) <= AUTO_LINK_DAY_WINDOW
  );
}

/** Higher is closer: the category weighs most, then the amount, then the distance to the due date. */
export function scoreCandidate(template: RecurringMatchTemplate, candidate: RecurringMatchCandidate, month: string) {
  const category = candidate.categoryId === template.categoryId ? 3 : 0;
  const amount = Math.max(0, 2 - amountGap(template, candidate) * 4);
  const date = Math.max(0, 1 - dayDistance(candidate.date, buildDateInMonth(month, template.dayOfMonth)) / 30);
  return category + amount + date;
}

/** Only unambiguous pairs: the rule has a single strong candidate and that candidate is strong for no other rule. */
export function findAutoLinks({ month, templates, candidates, dismissed }: RecurringAutoLinkInput): RecurringAutoLink[] {
  const pairs = templates.flatMap((template) =>
    candidates
      .filter((candidate) => !dismissed.has(`${template.id}:${candidate.id}`) && isStrongMatch(template, candidate, month))
      .map((candidate) => ({ templateId: template.id, candidate }))
  );
  const count = (key: (pair: RecurringAutoLink) => string) =>
    pairs.reduce((totals, pair) => totals.set(key(pair), (totals.get(key(pair)) ?? 0) + 1), new Map<string, number>());
  const perTemplate = count((pair) => pair.templateId);
  const perCandidate = count((pair) => pair.candidate.id);
  return pairs.filter((pair) => perTemplate.get(pair.templateId) === 1 && perCandidate.get(pair.candidate.id) === 1);
}
