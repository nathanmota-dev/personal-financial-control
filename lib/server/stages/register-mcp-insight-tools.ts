import { getFinanceDatabase } from "@/lib/db";
import { isValidMonth } from "@/lib/finance-ui";
import type { RegisterMcpInsightToolsContext } from "@/lib/interfaces/stages/register-mcp-insight-tools";
import { readAnnotations } from "@/lib/mcp/tool-support";
import { getBudgetOverview } from "@/lib/server/budgets";
import { getCreditCardInvoiceDigests } from "@/lib/server/credit-card/invoice-digest";
import { getSpendingSummary, spendingSummaryInputSchema } from "@/lib/server/spending-summary";
import { z } from "zod";

const month = z.string().refine(isValidMonth, "Use YYYY-MM.");

export function registerMcpInsightTools({ server, handler, database }: RegisterMcpInsightToolsContext) {
  const resolveDb = async () => database ?? getFinanceDatabase();

  server.registerTool("get_spending_summary", {
    description: "Answer questions such as \"how much did I spend on groceries?\": totals per category and per month for a range of competence months, counted like the reports page (card purchases in their invoice month, cancelled entries and card bill payments left out). Filter by type, categories, account, uncategorized or description text; includeEntries also returns the matching entries, largest first.",
    inputSchema: spendingSummaryInputSchema,
    annotations: readAnnotations,
  }, handler(async (input) => getSpendingSummary(input, await resolveDb())));

  server.registerTool("get_budget_overview", {
    description: "Budget limits against what was spent per expense category in one competence month, including categories spent without a limit.",
    inputSchema: z.object({ competenceMonth: month }),
    annotations: readAnnotations,
  }, handler(async ({ competenceMonth }) => {
    const overview = await getBudgetOverview(competenceMonth, await resolveDb());
    return {
      month: overview.month,
      committedCents: overview.committedCents,
      rows: overview.rows.map(({ expenses, limit, ...row }) => ({ ...row, limitCents: limit?.amountCents ?? null, expenseCount: expenses.length })),
    };
  }));

  server.registerTool("get_credit_card_invoices", {
    description: "Invoice totals for one invoice month: per card, the total, the recorded bill with due date and status when there is one, and totals per category. Use list_credit_card_charges for the purchases themselves.",
    inputSchema: z.object({ invoiceMonth: month, accountId: z.string().uuid().optional() }),
    annotations: readAnnotations,
  }, handler(async ({ invoiceMonth, accountId }) => getCreditCardInvoiceDigests(invoiceMonth, accountId, await resolveDb())));
}
