import type {
  CategoryGroup,
  RecurringTransactionType,
  TransactionType,
} from "@/lib/db/schema";

export type DefaultCategoryDefinition = {
  id: string;
  name: string;
  group: CategoryGroup;
};

/**
 * Stable ids keep the demo fixture aligned with the categories inserted by the
 * database migration. Persistent databases still use the category name as the
 * idempotency key when the seed runs.
 */
export const defaultCategoryIds = {
  salary: "b0000000-0000-4000-8000-000000000101",
  housing: "b0000000-0000-4000-8000-000000000102",
  householdBills: "b0000000-0000-4000-8000-000000000103",
  food: "b0000000-0000-4000-8000-000000000104",
  transport: "b0000000-0000-4000-8000-000000000105",
  investments: "b0000000-0000-4000-8000-000000000106",
  other: "b0000000-0000-4000-8000-000000000107",
} as const;

export const defaultCategories = [
  { id: defaultCategoryIds.salary, name: "Salário", group: "income" },
  { id: defaultCategoryIds.housing, name: "Moradia", group: "fixed_expense" },
  {
    id: defaultCategoryIds.householdBills,
    name: "Contas da casa",
    group: "fixed_expense",
  },
  { id: defaultCategoryIds.food, name: "Alimentação", group: "variable_expense" },
  { id: defaultCategoryIds.transport, name: "Transporte", group: "variable_expense" },
  { id: defaultCategoryIds.investments, name: "Investimentos", group: "investment" },
  { id: defaultCategoryIds.other, name: "Outros", group: "variable_expense" },
] as const satisfies readonly DefaultCategoryDefinition[];

export const recurringDefaultCategoryNames: Record<RecurringTransactionType, string> = {
  income: "Salário",
  expense: "Outros",
  investment_contribution: "Investimentos",
};

export function getDefaultCategoryForRecurringType(type: RecurringTransactionType) {
  const name = recurringDefaultCategoryNames[type];
  return defaultCategories.find((category) => category.name === name) ?? defaultCategories[0];
}

export function isRecurringCategoryCompatible(
  group: CategoryGroup,
  type: RecurringTransactionType
) {
  if (type === "income") {
    return group === "income";
  }

  if (type === "investment_contribution") {
    return group === "investment";
  }

  return group === "fixed_expense" || group === "variable_expense";
}

export function isTransactionCategoryCompatible(
  group: CategoryGroup,
  type: TransactionType
) {
  if (type === "income") {
    return group === "income";
  }

  if (type === "investment_contribution" || type === "investment_withdrawal") {
    return group === "investment";
  }

  return group === "fixed_expense" || group === "variable_expense";
}
