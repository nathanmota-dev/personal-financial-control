import type { DemoFixture } from "@/lib/demo/contracts";
import { accountIds } from "./support";

const collectedAt = new Date("2026-07-15T09:00:00.000Z");

/** What the bank would report: used equals the demo invoices still to be paid on the reference date. */
export const creditCardLimits: DemoFixture["creditCardLimits"] = [
  { accountId: accountIds.credit, limitCents: 1000000, availableCents: 400000, collectedAt },
  { accountId: accountIds.santanderCredit, limitCents: 500000, availableCents: 200000, collectedAt },
  { accountId: accountIds.itauCredit, limitCents: 300000, availableCents: 108000, collectedAt },
];
