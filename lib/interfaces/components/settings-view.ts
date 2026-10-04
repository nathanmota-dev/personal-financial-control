
export type AccountRow = {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  initialBalanceCents: number;
  currentBalanceCents: number;
  creditClosingDay: number | null;
  creditDueDay: number;
  isArchived: boolean;
};

export type CategoryRow = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
  isArchived: boolean;
};
