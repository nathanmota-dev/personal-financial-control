export type FinanceActionError = {
  code: string;
  message: string;
  field?: string;
};

export type FinanceActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: FinanceActionError };
