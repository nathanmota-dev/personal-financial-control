import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface RegisterMcpCreditCardToolsContext {
  server: McpServer;
  handler: <T>(callback: (input: T) => Promise<unknown>) => (input: T) => Promise<{ content: { type: "text"; text: string; }[]; structuredContent: { ok: boolean; data: unknown; }; } | { content: { type: "text"; text: string; }[]; structuredContent: { code: string; message: string; issues?: undefined; ok: boolean; } | { code: string; message: string; issues: z.core.$ZodIssue[]; ok: boolean; }; isError: boolean; }>;
  database: import("@/lib/db").AppDb | undefined;
}
