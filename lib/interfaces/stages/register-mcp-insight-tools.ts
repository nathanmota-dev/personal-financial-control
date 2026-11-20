import type { AppDb } from "@/lib/db";
import type { handler } from "@/lib/mcp/tool-support";
import type { McpToolRegistrar } from "@/lib/interfaces/mcp-tool-registrar";

export interface RegisterMcpInsightToolsContext {
  server: McpToolRegistrar;
  handler: typeof handler;
  database: AppDb | undefined;
}
