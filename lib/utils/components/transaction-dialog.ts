import { isTransactionCategoryCompatible } from "@/lib/category-defaults";
import type {
TransactionAccountOption,
TransactionCategoryOption,
TransactionRow
} from "@/lib/interfaces/transactions";
import { selectAccountId } from "@/lib/utils/account-choice";

export const NO_CATEGORY_VALUE = "__no-category__";

export const fieldClassName = "";

export const selectClassName = "w-full";

export const labelClassName = "text-xs font-medium text-content";

export function compatibleCategories(
  categories: TransactionCategoryOption[],
  type: TransactionRow["type"],
) {
  return categories.filter((category) =>
    isTransactionCategoryCompatible(category.group, type),
  );
}

export function categoryValue(
  categories: TransactionCategoryOption[],
  type: TransactionRow["type"],
  currentCategoryId?: string | null,
) {
  const category = categories.find(
    (option) =>
      option.id === currentCategoryId &&
      isTransactionCategoryCompatible(option.group, type),
  );

  if (category) {
    return category.id;
  }

  return type === "income" || type === "expense"
    ? NO_CATEGORY_VALUE
    : (compatibleCategories(categories, type)[0]?.id ?? NO_CATEGORY_VALUE);
}

export function accountValue(accounts: TransactionAccountOption[], type: TransactionRow["type"], currentAccountId?: string) { return selectAccountId(accounts, type === "expense" || investmentType(type), currentAccountId); }

export function investmentType(type: TransactionRow["type"]) {
  return type === "investment_contribution" || type === "investment_withdrawal";
}

export { todayDate } from "@/lib/utils/finance-date";
