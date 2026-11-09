import type { PluggyAccountSyncStep } from "@/lib/interfaces/pluggy";
import { importLinkBills } from "../card-bills/import-bills";
import { linkBankBillPayments } from "../card-bills/link-payments";
import { reportLinkBills } from "../card-bills/report-bills";

export const importCardBillsStep: PluggyAccountSyncStep = {
  name: "import-card-bills",
  scope: "account",
  async run(context, link) {
    if (link.kind === "credit") return importLinkBills(context, link);
  },
};

/** After every card's bills are known, because a payment on checking can belong to any card. */
export const matchBillPaymentsStep: PluggyAccountSyncStep = {
  name: "match-bill-payments",
  scope: "account",
  async run(context, link) {
    if (link.kind === "bank") return linkBankBillPayments(context, link);
  },
};

/** Last, because a bill payment counts as outside the linked accounts only after every bank account was read. */
export const reportCardBillsStep: PluggyAccountSyncStep = {
  name: "report-card-bills",
  scope: "account",
  async run(context, link) {
    if (link.kind === "credit") return reportLinkBills(context, link);
  },
};
