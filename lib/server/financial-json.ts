import type { ImportRow } from "@/lib/interfaces/financial-json";
import { z } from "zod";
export const moneyItemSchema = z.object({
  name: z.string().trim().min(1),
  value: z.number().finite().nonnegative(),
});

export const importPayloadSchema = z.object({
  Entradas: z.array(moneyItemSchema).default([]),
  "Gastos fixos": z.array(moneyItemSchema).default([]),
  "Gastos variáveis": z.array(moneyItemSchema).default([]),
  Investimentos: z.array(moneyItemSchema).default([]),
  context: z
    .object({
      accountName: z.string().trim().min(1).default("Conta principal"),
      accountType: z
        .enum(["checking", "savings", "cash", "credit", "investment"])
        .default("checking"),
      competenceMonth: z.string().default("2026-05"),
      transactionDate: z.string().default("2026-05-01"),
      status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
    })
    .default({
      accountName: "Conta principal",
      accountType: "checking",
      competenceMonth: "2026-05",
      transactionDate: "2026-05-01",
      status: "posted",
    }),
});

export function flattenPayload(payload: z.infer<typeof importPayloadSchema>): ImportRow[] {
  return [
    ...payload.Entradas.map((item) => ({
      section: "Entradas" as const,
      categoryGroup: "income" as const,
      transactionType: "income" as const,
      item,
    })),
    ...payload["Gastos fixos"].map((item) => ({
      section: "Gastos fixos" as const,
      categoryGroup: "fixed_expense" as const,
      transactionType: "expense" as const,
      item,
    })),
    ...payload["Gastos variáveis"].map((item) => ({
      section: "Gastos variáveis" as const,
      categoryGroup: "variable_expense" as const,
      transactionType: "expense" as const,
      item,
    })),
    ...payload.Investimentos.map((item) => ({
      section: "Investimentos" as const,
      categoryGroup: "investment" as const,
      transactionType: "investment_contribution" as const,
      item,
    })),
  ];
}

