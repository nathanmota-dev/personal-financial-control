import type { FinanceActionResult } from "@/lib/interfaces/finance-actions";
import { DomainError } from "@/lib/server/errors";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";


export function revalidateFinanceViews() {
  [
    "/",
    "/dashboard",
    "/budgets",
    "/transactions",
    "/recurring",
    "/projected-balance",
    "/investments",
    "/investments/portfolio",
    "/investments/emergency-reserve",
    "/goals",
    "/credit-card",
  ].forEach((path) => {
    revalidatePath(path);
  });
}

export function validationError(error: ZodError) {
  const issue = error.issues[0];
  const rawField = issue?.path[0];
  const field = typeof rawField === "string" ? rawField : undefined;

  if (field === "name" || field === "description") {
    return {
      code: "INVALID_NAME",
      message: "Informe um nome ou descrição.",
      field: field === "description" ? "name" : field,
    };
  }

  if (field === "amountCents") {
    return {
      code: "INVALID_AMOUNT",
      message: "Informe um valor maior que zero.",
      field,
    };
  }

  return {
    code: "VALIDATION_ERROR",
    message: issue?.message ?? "Confira os dados informados.",
    field,
  };
}

export function actionError(error: unknown) {
  if (error instanceof DomainError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof ZodError) {
    return validationError(error);
  }

  return {
    code: "FINANCE_ACTION_FAILED",
    message: "Não foi possível concluir esta operação.",
  };
}

export async function runFinanceAction<T>(operation: () => Promise<T>): Promise<FinanceActionResult<T>> {
  try {
    const data = await operation();
    revalidateFinanceViews();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}
