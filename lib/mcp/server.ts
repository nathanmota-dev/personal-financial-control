import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { AppDb } from "@/lib/db";
import { registerAllMcpTools } from "./register-tools";
import { instructions } from "./tool-support";

export function createPersonalFinanceMcpServer(database?: AppDb) {
  const server = new McpServer(
    { name: "personal-financial-control", version: "1.0.0" },
    { instructions }
  );

  registerAllMcpTools(server, database);

  return server;
}

export { instructions as personalFinanceMcpInstructions };
