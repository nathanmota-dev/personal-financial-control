import type { AppDb } from "@/lib/db";
import type { CapturedMcpTool } from "@/lib/interfaces/chat-tools";
import type { McpToolRegistrar } from "@/lib/interfaces/mcp-tool-registrar";
import { registerAllMcpTools } from "@/lib/mcp/register-tools";

/**
 * Runs the MCP registrations against a recorder instead of a real server, so the chat sees exactly the
 * tools, schemas and rules of the MCP without a second copy of them.
 */
export function captureMcpTools(database?: AppDb): CapturedMcpTool[] {
  const captured: CapturedMcpTool[] = [];
  const server = {
    registerTool(name: string, config: { description?: string; inputSchema?: unknown; annotations?: { readOnlyHint?: boolean } }, callback: (input: unknown) => Promise<{ structuredContent?: unknown }>) {
      captured.push({
        name,
        description: config.description ?? "",
        inputSchema: config.inputSchema as CapturedMcpTool["inputSchema"],
        readOnly: config.annotations?.readOnlyHint === true,
        run: callback,
      });
    },
  } as unknown as McpToolRegistrar;

  registerAllMcpTools(server, database);
  return captured;
}
