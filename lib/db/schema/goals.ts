import { encryptedInteger,encryptedText } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
index,
sqliteTable
} from "drizzle-orm/sqlite-core";
import { timestampColumns } from "./accounts";
import { recordId,referenceColumn } from "./columns";
import { allocationTypes,goalCategories,goalStatuses } from "./enums";
import { transactions } from "./transactions";

export const financialGoals = sqliteTable(
  "financial_goals",
  {
    id: recordId(),
    name: encryptedText("name", "financial_goals.name").notNull(),
    category: encryptedText("category", "financial_goals.category", { enum: goalCategories }).notNull(),
    targetAmountCents: encryptedInteger("target_amount_cents", "financial_goals.target_amount_cents").notNull(),
    targetDate: encryptedText("target_date", "financial_goals.target_date"),
    plannedMonthlyContributionCents: encryptedInteger("planned_monthly_contribution_cents", "financial_goals.planned_monthly_contribution_cents").notNull(),
    priority: encryptedInteger("priority", "financial_goals.priority").notNull().$defaultFn(() => 1),
    status: encryptedText("status", "financial_goals.status", { enum: goalStatuses }).notNull().$defaultFn(() => "active"),
    color: encryptedText("color", "financial_goals.color").notNull().$defaultFn(() => "#38bdf8"),
    notes: encryptedText("notes", "financial_goals.notes"),
    ...timestampColumns("financial_goals"),
  },
  (table) => [
    ...encryptionChecks(table),
  ]
);

export const financialGoalAllocations = sqliteTable(
  "financial_goal_allocations",
  {
    id: recordId(),
    goalId: referenceColumn("goal_id", () => financialGoals.id, "cascade").notNull(),
    transactionId: referenceColumn("transaction_id", () => transactions.id, "set null"),
    type: encryptedText("type", "financial_goal_allocations.type", { enum: allocationTypes }).notNull(),
    amountCents: encryptedInteger("amount_cents", "financial_goal_allocations.amount_cents").notNull(),
    occurredOn: encryptedText("occurred_on", "financial_goal_allocations.occurred_on").notNull(),
    notes: encryptedText("notes", "financial_goal_allocations.notes"),
    ...timestampColumns("financial_goal_allocations"),
  },
  (table) => [
    ...encryptionChecks(table),
    index("financial_goal_allocations_goal_idx").on(table.goalId),
    index("financial_goal_allocations_transaction_idx").on(table.transactionId),
  ]
);
