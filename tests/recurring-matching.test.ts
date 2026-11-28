import { describe, expect, it } from "vitest";

import type { RecurringMatchCandidate, RecurringMatchTemplate } from "@/lib/interfaces/recurring-occurrences";
import { findAutoLinks, isStrongMatch, recurringCandidateWindow, scoreCandidate } from "@/lib/recurring-matching";

const month = "2026-11";

function rule(id: string, values: Partial<RecurringMatchTemplate>): RecurringMatchTemplate {
  return { id, type: "expense", categoryId: `${id}-category`, amountCents: 10000, dayOfMonth: 10, ...values };
}

function entry(id: string, values: Partial<RecurringMatchCandidate>): RecurringMatchCandidate {
  return { id, kind: "transaction", type: "expense", categoryId: null, categoryName: null, amountCents: 10000, date: "2026-11-10", description: id, accountName: "Conta", ...values };
}

// The November shape of the real ledger: rules on the bank account, paid by imported entries.
const templates = [
  rule("salary", { type: "income", categoryId: "income", amountCents: 426740, dayOfMonth: 5 }),
  rule("energy", { categoryId: "home", amountCents: 50000, dayOfMonth: 15 }),
  rule("gym", { categoryId: "health", amountCents: 12500, dayOfMonth: 10 }),
  rule("phone", { categoryId: "phone", amountCents: 5000, dayOfMonth: 20 }),
  rule("offer", { categoryId: "church", amountCents: 20000, dayOfMonth: 6 }),
  rule("invest", { type: "investment_contribution", categoryId: "investment", amountCents: 200000, dayOfMonth: 6 }),
  rule("google", { categoryId: "other", amountCents: 1000, dayOfMonth: 12 }),
];
const candidates = [
  entry("pay", { type: "income", categoryId: "income", amountCents: 426740, date: "2026-11-05" }),
  entry("light", { categoryId: "home", amountCents: 50000, date: "2026-11-14" }),
  entry("gym-fee", { categoryId: "health", amountCents: 12500, date: "2026-11-10" }),
  entry("inter-phone", { categoryId: "phone", amountCents: 5000, date: "2026-11-21", accountName: "Banco Inter" }),
  entry("tithe", { categoryId: "church", amountCents: 25000, date: "2026-11-06" }),
  entry("cdb-1", { type: "investment_contribution", categoryId: "investments", amountCents: 180000, date: "2026-11-06" }),
  entry("cdb-2", { type: "investment_contribution", categoryId: "investments", amountCents: 20000, date: "2026-11-06" }),
  entry("cloud", { kind: "card", categoryId: "cloud", amountCents: 1000, date: "2026-11-12" }),
];

describe("recurring matching", () => {
  it("links only the rules with a single strong entry", () => {
    const links = findAutoLinks({ month, templates, candidates, dismissed: new Set() });
    expect(links.map((link) => [link.templateId, link.candidate.id])).toEqual([
      ["salary", "pay"],
      ["energy", "light"],
      ["gym", "gym-fee"],
      ["phone", "inter-phone"],
    ]);
  });

  it("needs the category, an amount within 10% and a date within 7 days of the due date", () => {
    const gym = templates[2];
    expect(isStrongMatch(gym, entry("ok", { categoryId: "health", amountCents: 13750, date: "2026-11-17" }), month)).toBe(true);
    expect(isStrongMatch(gym, entry("amount", { categoryId: "health", amountCents: 13751 }), month)).toBe(false);
    expect(isStrongMatch(gym, entry("date", { categoryId: "health", date: "2026-11-18", amountCents: 12500 }), month)).toBe(false);
    expect(isStrongMatch(gym, entry("category", { categoryId: "other", amountCents: 12500 }), month)).toBe(false);
    expect(isStrongMatch(gym, entry("type", { type: "income", categoryId: "health", amountCents: 12500 }), month)).toBe(false);
    expect(isStrongMatch(rule("income", { type: "income", categoryId: "x" }), entry("card", { kind: "card", categoryId: "x" }), month)).toBe(false);
  });

  it("leaves ambiguous pairs for the user", () => {
    const twoEntries = findAutoLinks({ month, templates: [rule("a", {})], candidates: [entry("one", { categoryId: "a-category" }), entry("two", { categoryId: "a-category" })], dismissed: new Set() });
    const twoRules = findAutoLinks({ month, templates: [rule("a", { categoryId: "shared" }), rule("b", { categoryId: "shared" })], candidates: [entry("one", { categoryId: "shared" })], dismissed: new Set() });
    expect([twoEntries, twoRules]).toEqual([[], []]);
  });

  it("does not link again a pair the user undid", () => {
    const links = findAutoLinks({ month, templates: [rule("a", {})], candidates: [entry("one", { categoryId: "a-category" })], dismissed: new Set(["a:one"]) });
    expect(links).toEqual([]);
  });

  it("ranks the closest entries first and spans the window around the month", () => {
    const offer = templates[4];
    expect(scoreCandidate(offer, candidates[4], month)).toBeGreaterThan(scoreCandidate(offer, entry("far", { amountCents: 20000, date: "2026-11-28" }), month));
    expect(recurringCandidateWindow("2026-02")).toEqual({ start: "2026-01-25", end: "2026-03-07" });
  });
});
