import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
financialGoalAllocations,
financialGoals,
goalCategories,
goalStatuses
} from "@/lib/db/schema";
import {
normalizeCompetenceMonth,
normalizeDate
} from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { z } from "zod";


export type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type DbContext = AppDb | AppDbTransaction;

export type GoalRow = typeof financialGoals.$inferSelect;

export type AllocationRow = typeof financialGoalAllocations.$inferSelect;

export const DEFAULT_GOAL_COLOR = "#38bdf8";

export const nullableTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .nullable()
  .optional();

export const optionalMonthSchema = z
  .string()
  .trim()
  .transform((value) => {
    if (!value.length) {
      return null;
    }

    if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
      return normalizeDate(value).slice(0, 7);
    }

    return normalizeCompetenceMonth(value);
  })
  .nullable()
  .optional();

export const goalValuesSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum(goalCategories).default("other"),
  targetAmountCents: z.number().int().positive(),
  targetDate: optionalMonthSchema,
  plannedMonthlyContributionCents: z.number().int().nonnegative().default(0),
  priority: z.number().int().min(0).max(2).default(1),
  status: z.enum(goalStatuses).default("active"),
  color: z.string().trim().min(1).default(DEFAULT_GOAL_COLOR),
  notes: nullableTextSchema,
});

export const createGoalSchema = goalValuesSchema.extend({
  initialAllocationCents: z.number().int().nonnegative().default(0),
  initialAllocationDate: z.string().trim().optional(),
});

export const updateGoalSchema = goalValuesSchema.partial().extend({
  id: z.string().uuid(),
});

export const allocationSchema = z.object({
  goalId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  occurredOn: z.string().trim(),
  notes: nullableTextSchema,
});

export const goalContributionSchema = z.object({
  goalId: z.string().uuid(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string().trim(),
  notes: nullableTextSchema,
});

export async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export function todayIso() {
  return getFinanceToday();
}

export function normalizeNullableMonth(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
    return normalizeDate(value).slice(0, 7);
  }

  return normalizeCompetenceMonth(value);
}

export function normalizeStoredTargetMonth(value: string | null) {
  return value ? value.slice(0, 7) : null;
}

export function normalizeNotes(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
