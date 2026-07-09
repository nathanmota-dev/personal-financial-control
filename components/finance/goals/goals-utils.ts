import {
  centsToMoneyInput,
  formatMonthLabel,
} from "@/lib/finance-ui";

import { GOAL_COLORS, GOAL_PRIORITY_OPTIONS } from "./goals-constants";
import type { ApiResponse, GoalCard, GoalFormState } from "./goals-types";

export function buildIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeGoalMonth(value: string | null | undefined) {
  if (!value) {
    return buildMonthValue();
  }

  return value.slice(0, 7);
}

export function formatGoalTargetMonth(value: string | null) {
  if (!value) {
    return "Sem prazo definido";
  }

  return `Prazo ${formatMonthLabel(normalizeGoalMonth(value))}`;
}

export function normalizeGoalPriority(value: number) {
  return GOAL_PRIORITY_OPTIONS.some((option) => Number(option.value) === value)
    ? String(value)
    : "1";
}

export function emptyGoalForm(): GoalFormState {
  return {
    name: "",
    category: "other",
    targetAmount: "",
    targetDate: buildMonthValue(),
    plannedMonthlyContribution: "",
    priority: "1",
    status: "active",
    color: GOAL_COLORS[0],
    notes: "",
    initialAllocation: "",
  };
}

export function goalToForm(goal: GoalCard): GoalFormState {
  return {
    name: goal.name,
    category: goal.category,
    targetAmount: centsToMoneyInput(goal.targetAmountCents),
    targetDate: normalizeGoalMonth(goal.targetDate),
    plannedMonthlyContribution: centsToMoneyInput(
      goal.plannedMonthlyContributionCents
    ),
    priority: normalizeGoalPriority(goal.priority),
    status: goal.status,
    color: goal.color,
    notes: goal.notes ?? "",
    initialAllocation: "",
  };
}

export async function apiRequest<T>(
  url: string,
  init: RequestInit,
  fallbackMessage: string
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.ok === false ? payload.error.message : fallbackMessage);
  }

  return payload.data;
}
