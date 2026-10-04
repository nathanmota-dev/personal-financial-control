import type { importPayloadSchema } from "@/lib/server/financial-json";
import type { z } from "zod";

export type ImportRow = {
  section: "Entradas" | "Gastos fixos" | "Gastos variáveis" | "Investimentos";
  categoryGroup: "income" | "fixed_expense" | "variable_expense" | "investment";
  transactionType: "income" | "expense" | "investment_contribution";
  item: {
    name: string;
    value: number;
  };
};
export type FinancialImportPayload = z.infer<typeof importPayloadSchema>;
