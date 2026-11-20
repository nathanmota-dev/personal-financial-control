import { tool, type ToolSet } from "ai";

import type { AppDb } from "@/lib/db";
import { captureMcpTools } from "@/lib/chat/capture-mcp-tools";

/**
 * The chat only queries. A tool is offered when the MCP flags it read-only, so a write tool added to the
 * MCP later never reaches the model by accident.
 */
export function buildChatTools(database?: AppDb): ToolSet {
  const tools: ToolSet = {};
  for (const captured of captureMcpTools(database)) {
    if (!captured.readOnly) continue;
    tools[captured.name] = tool({
      description: captured.description,
      inputSchema: captured.inputSchema,
      execute: async (input: unknown) => (await captured.run(input)).structuredContent,
    });
  }
  return tools;
}
