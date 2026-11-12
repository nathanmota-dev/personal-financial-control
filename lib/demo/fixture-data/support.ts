import { defaultCategoryIds } from "@/lib/category-defaults";
import type { DemoFixture } from "@/lib/demo/contracts";

export const id = (prefix: string, value: number) =>
  `${prefix}-${String(value).padStart(12, "0")}`;

export const accountIds = {
  checking: id("a0000000-0000-4000-8000", 1),
  savings: id("a0000000-0000-4000-8000", 2),
  cash: id("a0000000-0000-4000-8000", 3),
  credit: id("a0000000-0000-4000-8000", 4),
  investment: id("a0000000-0000-4000-8000", 5),
  santanderCredit: id("a0000000-0000-4000-8000", 6),
  itauCredit: id("a0000000-0000-4000-8000", 7),
} as const;

export const categoryIds = {
  salary: defaultCategoryIds.salary,
  rent: defaultCategoryIds.housing,
  utilities: defaultCategoryIds.householdBills,
  groceries: id("b0000000-0000-4000-8000", 4),
  restaurants: id("b0000000-0000-4000-8000", 5),
  transport: defaultCategoryIds.transport,
  health: id("b0000000-0000-4000-8000", 7),
  leisure: id("b0000000-0000-4000-8000", 8),
  education: id("b0000000-0000-4000-8000", 9),
  investments: defaultCategoryIds.investments,
  other: defaultCategoryIds.other,
  food: defaultCategoryIds.food,
} as const;

export const recurringIds = {
  salary: id("c0000000-0000-4000-8000", 1),
  rent: id("c0000000-0000-4000-8000", 2),
  utilities: id("c0000000-0000-4000-8000", 3),
  investments: id("c0000000-0000-4000-8000", 4),
  internet: id("c0000000-0000-4000-8000", 5),
  health: id("c0000000-0000-4000-8000", 6),
  streaming: id("c0000000-0000-4000-8000", 7),
} as const;

export const months = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
] as const;

export function dateFor(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function isIncludedInCheckpoint(month: string) {
  return month <= "2026-03";
}

export function monthlyTransactions({
  prefix,
  templateId,
  categoryId,
  type,
  amounts,
  day,
  description,
}: {
  prefix: string;
  templateId: string;
  categoryId: string;
  type: "income" | "expense" | "investment_contribution";
  amounts: number[];
  day: number;
  description: string;
}) {
  return months.map((month, index) => ({
    id: id(prefix, index + 1),
    accountId: accountIds.checking,
    categoryId,
    recurringTemplateId: templateId,
    type,
    status: "posted" as const,
    amountCents: amounts[index],
    transactionDate: dateFor(month, day),
    competenceMonth: month,
    description,
    isIncludedInInvestmentCheckpoint:
      type === "investment_contribution" ? isIncludedInCheckpoint(month) : true,
  }));
}

export const salaryTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8001",
  templateId: recurringIds.salary,
  categoryId: categoryIds.salary,
  type: "income",
  amounts: months.map(() => 650000),
  day: 5,
  description: "Salário mensal",
});

export const rentTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8002",
  templateId: recurringIds.rent,
  categoryId: categoryIds.rent,
  type: "expense",
  amounts: months.map(() => 80000),
  day: 8,
  description: "Aluguel",
});

export const utilityTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8003",
  templateId: recurringIds.utilities,
  categoryId: categoryIds.utilities,
  type: "expense",
  amounts: months.map((_, index) => 27000 + index * 1000),
  day: 15,
  description: "Contas da casa",
});

/** Bills due after the demo reference date: pending, except the health plan paid ahead of its due date. */
const upcomingBills = [
  { n: 1, templateId: recurringIds.internet, amountCents: 11990, day: 20, description: "Internet", status: "pending" as const, category: "utilities" as const },
  { n: 2, templateId: recurringIds.health, amountCents: 38900, day: 25, description: "Plano de saúde", status: "posted" as const, category: "health" as const },
  { n: 3, templateId: recurringIds.streaming, amountCents: 5590, day: 28, description: "Streaming", status: "pending" as const, category: "leisure" as const },
];

export const upcomingBillTransactions: DemoFixture["transactions"] = upcomingBills.map((bill) => ({
  id: id("c0000000-0000-4000-8010", bill.n),
  accountId: accountIds.checking,
  categoryId: categoryIds[bill.category],
  recurringTemplateId: bill.templateId,
  type: "expense" as const,
  status: bill.status,
  amountCents: bill.amountCents,
  transactionDate: dateFor("2026-07", bill.day),
  competenceMonth: "2026-07",
  description: bill.description,
  isIncludedInInvestmentCheckpoint: true,
}));

/** Extra housing costs of the reference month, shown by the dashboard housing panel. */
export const housingExtraTransactions: DemoFixture["transactions"] = [
  { n: 1, description: "Condomínio", amountCents: 20000, day: 10 },
  { n: 2, description: "Luz", amountCents: 11000, day: 12 },
].map((item) => ({
  id: id("c0000000-0000-4000-8011", item.n),
  accountId: accountIds.checking,
  categoryId: categoryIds.rent,
  type: "expense" as const,
  status: "posted" as const,
  amountCents: item.amountCents,
  transactionDate: dateFor("2026-07", item.day),
  competenceMonth: "2026-07",
  description: item.description,
  isIncludedInInvestmentCheckpoint: true,
}));

export const investmentTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8004",
  templateId: recurringIds.investments,
  categoryId: categoryIds.investments,
  type: "investment_contribution",
  amounts: months.map(() => 120000),
  day: 20,
  description: "Aporte mensal",
});

export const variableTransactions: DemoFixture["transactions"] = [
  ...months.map((month, index) => ({
    id: id("c0000000-0000-4000-8005", index + 1),
    accountId: accountIds.checking,
    categoryId: categoryIds.groceries,
    type: "expense" as const,
    status: "posted" as const,
    amountCents: 78000 + index * 2500,
    transactionDate: dateFor(month, 11),
    competenceMonth: month,
    description: "Mercado do mês",
  })),
  ...months.slice(1).map((month, index) => ({
    id: id("c0000000-0000-4000-8006", index + 1),
    accountId: accountIds.checking,
    categoryId: categoryIds.restaurants,
    type: "expense" as const,
    status: "posted" as const,
    amountCents: 32000 + index * 3000,
    transactionDate: dateFor(month, 18),
    competenceMonth: month,
    description: "Restaurantes e cafés",
  })),
  ...months.map((month, index) => ({
    id: id("c0000000-0000-4000-8007", index + 1),
    accountId: accountIds.checking,
    categoryId: categoryIds.transport,
    type: "expense" as const,
    status: "posted" as const,
    amountCents: 21000 + index * 1200,
    transactionDate: dateFor(month, 22),
    competenceMonth: month,
    description: "Transporte e mobilidade",
  })),
  {
    id: id("c0000000-0000-4000-8008", 1),
    accountId: accountIds.checking,
    categoryId: categoryIds.health,
    type: "expense",
    status: "posted",
    amountCents: 45000,
    transactionDate: "2026-07-03",
    competenceMonth: "2026-07",
    description: "Plano de saúde",
  },
  {
    id: id("c0000000-0000-4000-8008", 2),
    accountId: accountIds.checking,
    categoryId: categoryIds.leisure,
    type: "expense",
    status: "pending",
    amountCents: 18500,
    transactionDate: "2026-07-14",
    competenceMonth: "2026-07",
    description: "Cinema e lazer",
  },
  {
    id: id("c0000000-0000-4000-8008", 3),
    accountId: accountIds.checking,
    categoryId: categoryIds.education,
    type: "expense",
    status: "cancelled",
    amountCents: 25000,
    transactionDate: "2026-07-09",
    competenceMonth: "2026-07",
    description: "Curso cancelado",
  },
];

export const investmentWithdrawal = {
  id: id("c0000000-0000-4000-8009", 1),
  accountId: accountIds.checking,
  categoryId: categoryIds.investments,
  type: "investment_withdrawal" as const,
  status: "posted" as const,
  amountCents: 80000,
  transactionDate: "2026-06-25",
  competenceMonth: "2026-06",
  description: "Resgate parcial",
  isIncludedInInvestmentCheckpoint: false,
};
