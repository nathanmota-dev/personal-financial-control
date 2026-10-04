import type { AppDb } from "@/lib/db";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface RegisterMcpTransactionMutationToolsContext {
  server: McpServer;
  handler: <T>(callback: (input: T) => Promise<unknown>) => (input: T) => Promise<{ content: { type: "text"; text: string; }[]; structuredContent: { ok: boolean; data: unknown; }; } | { content: { type: "text"; text: string; }[]; structuredContent: { code: string; message: string; issues?: undefined; ok: boolean; } | { code: string; message: string; issues: z.core.$ZodIssue[]; ok: boolean; }; isError: boolean; }>;
  requireCommonTransaction: (id: string, database?: AppDb) => Promise<{ type: "income" | "expense" | "investment_contribution" | "investment_withdrawal"; accountId: string; amountCents: number; description: string; id: string; createdAt: Date; updatedAt: Date; status: "pending" | "posted" | "cancelled"; categoryId: string | null; recurringTemplateId: string | null; transactionDate: string; competenceMonth: string; notes: string | null; importFingerprint: string | null; isIncludedInInvestmentCheckpoint: boolean; importFingerprintHash: string | null; competenceMonthHash: string | null; }>;
  database: import("@/lib/db").AppDb | undefined;
  requireNonCreditAccount: (accountId: string, database?: AppDb) => Promise<{ type: "checking" | "savings" | "cash" | "credit" | "investment"; id: string; name: string; initialBalanceCents: number; creditClosingDay: number | null; creditDueDay: number; isArchived: boolean; nameHash: string | null; createdAt: Date; updatedAt: Date; }>;
}
