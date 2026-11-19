import type { AppDb } from "@/lib/db";
import type { handler } from "@/lib/mcp/tool-support";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface RegisterMcpCategoryToolsContext {
  server: McpServer;
  handler: typeof handler;
  database: AppDb | undefined;
}
