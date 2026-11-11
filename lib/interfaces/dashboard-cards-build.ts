export type BuildDashboardCardInput = {
  account: { id: string; name: string; creditDueDay: number };
  month: string;
  /** Computed invoice totals (installments and card expenses) by invoice month. */
  totalsByMonth: Map<string, number>;
  /** Bills override computed totals and carry status and due date. */
  billRows: Array<{ invoiceMonth: string; dueDate: string; statementTotalCents: number; status: "open" | "paid" }>;
};
