export const PENDING_CATEGORY_NAME = "A classificar";
export const PENDING_CATEGORY_GROUP = "variable_expense";

/** Card purchases require a category, so this placeholder stands for "not classified yet". */
export function isPendingCategory(category: { name: string; group: string } | null | undefined) {
  return category?.name === PENDING_CATEGORY_NAME && category.group === PENDING_CATEGORY_GROUP;
}
