
export interface ImportFinancialRowsContext {
  flattenPayload: (payload: import("@/lib/interfaces/financial-json").FinancialImportPayload) => import("@/lib/interfaces/financial-json").ImportRow[];
  payload: { Entradas: { name: string; value: number; }[]; "Gastos fixos": { name: string; value: number; }[]; "Gastos vari\u00E1veis": { name: string; value: number; }[]; Investimentos: { name: string; value: number; }[]; context: { accountName: string; accountType: "checking" | "savings" | "cash" | "credit" | "investment"; competenceMonth: string; transactionDate: string; status: "pending" | "posted" | "cancelled"; }; };
  db: import("@/lib/db").AppDb;
  account: { id: string; name: string; type: "checking" | "savings" | "cash" | "credit" | "investment"; initialBalanceCents: number; creditClosingDay: number | null; creditDueDay: number; isArchived: boolean; nameHash: string | null; createdAt: Date; updatedAt: Date; };
}
