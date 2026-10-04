import {
isRecurringCategoryCompatible,
recurringDefaultCategoryNames,
} from "@/lib/category-defaults";
import type {
RecurringDialogProps,
RecurringTemplateRow,
} from "@/lib/interfaces/recurring";
import { selectAccountId } from "@/lib/utils/account-choice";

export const recurringFieldClassName = "";

export const recurringSelectTriggerClassName = "w-full";

export const recurringSelectContentClassName = "";

export const recurringSelectItemClassName = "";

export const recurringFieldLabelClassName = "text-xs font-medium text-content";

export function compatibleCategories(
  categories: RecurringDialogProps["categories"],
  type: RecurringTemplateRow["type"],
) {
  return categories.filter((category) =>
    isRecurringCategoryCompatible(category.group, type),
  );
}

export function defaultCategoryId(
  categories: RecurringDialogProps["categories"],
  type: RecurringTemplateRow["type"],
  currentCategoryId?: string | null,
) {
  const available = compatibleCategories(categories, type);
  const current = available.find(
    (category) => category.id === currentCategoryId,
  );

  return (
    current?.id ??
    available.find(
      (category) => category.name === recurringDefaultCategoryNames[type],
    )?.id ??
    available[0]?.id ??
    ""
  );
}

export function defaultAccountId(accounts: RecurringDialogProps["accounts"], type: RecurringTemplateRow["type"], currentAccountId?: string) { return selectAccountId(accounts, type === "investment_contribution", currentAccountId); }
