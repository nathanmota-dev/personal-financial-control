import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** The only part of the MCP server the tool registrations use, so the chat can capture the same definitions. */
export type McpToolRegistrar = Pick<McpServer, "registerTool">;
