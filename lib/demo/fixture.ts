import type { DemoFixture } from "@/lib/demo/contracts";

const id = (prefix: string, value: number) =>
  `${prefix}-${String(value).padStart(12, "0")}`;

const accountIds = {
  checking: id("a0000000-0000-4000-8000", 1),
  savings: id("a0000000-0000-4000-8000", 2),
  cash: id("a0000000-0000-4000-8000", 3),
  credit: id("a0000000-0000-4000-8000", 4),
  investment: id("a0000000-0000-4000-8000", 5),
} as const;

const categoryIds = {
  salary: id("b0000000-0000-4000-8000", 1),
  rent: id("b0000000-0000-4000-8000", 2),
  utilities: id("b0000000-0000-4000-8000", 3),
  groceries: id("b0000000-0000-4000-8000", 4),
  restaurants: id("b0000000-0000-4000-8000", 5),
  transport: id("b0000000-0000-4000-8000", 6),
  health: id("b0000000-0000-4000-8000", 7),
  leisure: id("b0000000-0000-4000-8000", 8),
  education: id("b0000000-0000-4000-8000", 9),
  investments: id("b0000000-0000-4000-8000", 10),
} as const;

const recurringIds = {
  salary: id("c0000000-0000-4000-8000", 1),
  rent: id("c0000000-0000-4000-8000", 2),
  utilities: id("c0000000-0000-4000-8000", 3),
  investments: id("c0000000-0000-4000-8000", 4),
} as const;

const months = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
] as const;

function dateFor(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function isIncludedInCheckpoint(month: string) {
  return month <= "2026-03";
}

function monthlyTransactions({
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

const salaryTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8001",
  templateId: recurringIds.salary,
  categoryId: categoryIds.salary,
  type: "income",
  amounts: months.map(() => 650000),
  day: 5,
  description: "Salário mensal",
});

const rentTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8002",
  templateId: recurringIds.rent,
  categoryId: categoryIds.rent,
  type: "expense",
  amounts: months.map(() => 180000),
  day: 8,
  description: "Aluguel",
});

const utilityTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8003",
  templateId: recurringIds.utilities,
  categoryId: categoryIds.utilities,
  type: "expense",
  amounts: months.map((_, index) => 27000 + index * 1000),
  day: 15,
  description: "Contas da casa",
});

const investmentTransactions = monthlyTransactions({
  prefix: "c0000000-0000-4000-8004",
  templateId: recurringIds.investments,
  categoryId: categoryIds.investments,
  type: "investment_contribution",
  amounts: months.map(() => 120000),
  day: 20,
  description: "Aporte mensal",
});

const variableTransactions: DemoFixture["transactions"] = [
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

const investmentWithdrawal = {
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

export const demoFixture: DemoFixture = {
  categories: [
    { id: categoryIds.salary, name: "Salário", group: "income" },
    { id: categoryIds.rent, name: "Moradia", group: "fixed_expense" },
    { id: categoryIds.utilities, name: "Contas da casa", group: "fixed_expense" },
    { id: categoryIds.groceries, name: "Mercado", group: "variable_expense" },
    { id: categoryIds.restaurants, name: "Restaurantes", group: "variable_expense" },
    { id: categoryIds.transport, name: "Transporte", group: "variable_expense" },
    { id: categoryIds.health, name: "Saúde", group: "fixed_expense" },
    { id: categoryIds.leisure, name: "Lazer", group: "variable_expense" },
    { id: categoryIds.education, name: "Educação", group: "variable_expense" },
    { id: categoryIds.investments, name: "Investimentos", group: "investment" },
  ],
  accounts: [
    {
      id: accountIds.checking,
      name: "Nubank • Conta principal",
      type: "checking",
      initialBalanceCents: 420000,
    },
    {
      id: accountIds.savings,
      name: "Reserva de liquidez",
      type: "savings",
      initialBalanceCents: 850000,
    },
    {
      id: accountIds.cash,
      name: "Carteira",
      type: "cash",
      initialBalanceCents: 35000,
    },
    {
      id: accountIds.credit,
      name: "Visa Platinum",
      type: "credit",
      initialBalanceCents: 0,
      creditClosingDay: 10,
      creditDueDay: 18,
    },
    {
      id: accountIds.investment,
      name: "XP Investimentos",
      type: "investment",
      initialBalanceCents: 0,
    },
  ],
  recurringTemplates: [
    {
      id: recurringIds.salary,
      accountId: accountIds.checking,
      categoryId: categoryIds.salary,
      type: "income",
      status: "active",
      amountCents: 650000,
      dayOfMonth: 5,
      startMonth: "2026-01",
      description: "Salário mensal",
      lastGeneratedMonth: "2026-07",
    },
    {
      id: recurringIds.rent,
      accountId: accountIds.checking,
      categoryId: categoryIds.rent,
      type: "expense",
      status: "active",
      amountCents: 180000,
      dayOfMonth: 8,
      startMonth: "2026-01",
      description: "Aluguel",
      lastGeneratedMonth: "2026-07",
    },
    {
      id: recurringIds.utilities,
      accountId: accountIds.checking,
      categoryId: categoryIds.utilities,
      type: "expense",
      status: "active",
      amountCents: 33000,
      dayOfMonth: 15,
      startMonth: "2026-01",
      description: "Contas da casa",
      lastGeneratedMonth: "2026-07",
    },
    {
      id: recurringIds.investments,
      accountId: accountIds.checking,
      categoryId: categoryIds.investments,
      type: "investment_contribution",
      status: "active",
      amountCents: 120000,
      dayOfMonth: 20,
      startMonth: "2026-01",
      description: "Aporte mensal",
      lastGeneratedMonth: "2026-07",
    },
  ],
  transactions: [
    ...salaryTransactions,
    ...rentTransactions,
    ...utilityTransactions,
    ...investmentTransactions,
    ...variableTransactions,
    investmentWithdrawal,
  ],
  transfers: [
    {
      id: id("d0000000-0000-4000-8000", 1),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.savings,
      amountCents: 100000,
      transferDate: "2026-07-08",
      competenceMonth: "2026-07",
      description: "Reforço da reserva",
    },
    {
      id: id("d0000000-0000-4000-8000", 2),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.cash,
      amountCents: 20000,
      transferDate: "2026-07-12",
      competenceMonth: "2026-07",
      description: "Dinheiro para a carteira",
    },
  ],
  creditCardCharges: [
    {
      id: id("e0000000-0000-4000-8000", 1),
      accountId: accountIds.credit,
      categoryId: categoryIds.education,
      description: "Notebook para estudos",
      notes: "Compra parcelada",
      purchaseDate: "2026-05-18",
      totalAmountCents: 360000,
      installmentCount: 6,
      firstInvoiceMonth: "2026-06",
    },
    {
      id: id("e0000000-0000-4000-8000", 2),
      accountId: accountIds.credit,
      categoryId: categoryIds.leisure,
      description: "Passagens para férias",
      notes: "Viagem de fim de ano",
      purchaseDate: "2026-06-18",
      totalAmountCents: 240000,
      installmentCount: 4,
      firstInvoiceMonth: "2026-07",
    },
    {
      id: id("e0000000-0000-4000-8000", 3),
      accountId: accountIds.credit,
      categoryId: categoryIds.restaurants,
      description: "Experiência gastronômica",
      purchaseDate: "2026-04-15",
      totalAmountCents: 180000,
      installmentCount: 3,
      firstInvoiceMonth: "2026-05",
    },
  ],
  creditCardInstallments: [
    ...["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"].map(
      (invoiceMonth, index) => ({
        id: id("f0000000-0000-4000-8000", index + 1),
        chargeId: id("e0000000-0000-4000-8000", 1),
        installmentNumber: index + 1,
        amountCents: 60000,
        invoiceMonth,
      })
    ),
    ...["2026-07", "2026-08", "2026-09", "2026-10"].map((invoiceMonth, index) => ({
      id: id("f0000000-0000-4000-8001", index + 1),
      chargeId: id("e0000000-0000-4000-8000", 2),
      installmentNumber: index + 1,
      amountCents: 60000,
      invoiceMonth,
    })),
    ...["2026-05", "2026-06", "2026-07"].map((invoiceMonth, index) => ({
      id: id("f0000000-0000-4000-8002", index + 1),
      chargeId: id("e0000000-0000-4000-8000", 3),
      installmentNumber: index + 1,
      amountCents: 60000,
      invoiceMonth,
    })),
  ],
  investmentPortfolio: [
    {
      id: id("90000000-0000-4000-8000", 1),
      checkpointBalanceCents: 1850000,
      expectedMonthlyRateBps: 85,
      checkpointDate: "2026-03-31",
    },
  ],
  financialGoals: [
    {
      id: id("70000000-0000-4000-8000", 1),
      name: "Viagem em família",
      category: "travel",
      targetAmountCents: 1200000,
      targetDate: "2026-12",
      plannedMonthlyContributionCents: 60000,
      priority: 0,
      status: "active",
      color: "#38bdf8",
      notes: "Viagem planejada para o fim do ano.",
    },
    {
      id: id("70000000-0000-4000-8000", 2),
      name: "Reserva de emergência",
      category: "emergency",
      targetAmountCents: 3000000,
      targetDate: "2027-06",
      plannedMonthlyContributionCents: 150000,
      priority: 1,
      status: "active",
      color: "#14b8a6",
      notes: "Objetivo de segurança financeira.",
    },
    {
      id: id("70000000-0000-4000-8000", 3),
      name: "Curso avançado",
      category: "education",
      targetAmountCents: 450000,
      targetDate: "2026-10",
      plannedMonthlyContributionCents: 50000,
      priority: 2,
      status: "completed",
      color: "#a78bfa",
      notes: "Meta concluída com antecedência.",
    },
    {
      id: id("70000000-0000-4000-8000", 4),
      name: "Carro novo",
      category: "vehicle",
      targetAmountCents: 8000000,
      targetDate: "2028-01",
      plannedMonthlyContributionCents: 250000,
      priority: 2,
      status: "archived",
      color: "#64748b",
      notes: "Meta arquivada para uma segunda fase.",
    },
  ],
  financialGoalAllocations: [
    {
      id: id("80000000-0000-4000-8000", 1),
      goalId: id("70000000-0000-4000-8000", 1),
      type: "initial_allocation",
      amountCents: 370000,
      occurredOn: "2026-02-01",
      notes: "Alocação inicial para a viagem.",
    },
    {
      id: id("80000000-0000-4000-8000", 2),
      goalId: id("70000000-0000-4000-8000", 1),
      type: "contribution",
      amountCents: 80000,
      occurredOn: "2026-06-20",
      notes: "Aporte de junho.",
    },
    {
      id: id("80000000-0000-4000-8000", 3),
      goalId: id("70000000-0000-4000-8000", 2),
      type: "initial_allocation",
      amountCents: 900000,
      occurredOn: "2026-01-10",
      notes: "Base da reserva de emergência.",
    },
    {
      id: id("80000000-0000-4000-8000", 4),
      goalId: id("70000000-0000-4000-8000", 3),
      type: "initial_allocation",
      amountCents: 450000,
      occurredOn: "2026-04-05",
      notes: "Meta concluída.",
    },
    {
      id: id("80000000-0000-4000-8000", 5),
      goalId: id("70000000-0000-4000-8000", 4),
      type: "initial_allocation",
      amountCents: 300000,
      occurredOn: "2025-12-15",
      notes: "Alocação histórica.",
    },
  ],
};

export { accountIds, categoryIds, recurringIds };
