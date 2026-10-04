import { registerMcpCreditCardTools } from "@/lib/server/stages/register-mcp-credit-card-tools";
import { registerMcpReadAndCreateTools } from "@/lib/server/stages/register-mcp-read-and-create-tools";
import { registerMcpTransactionMutationTools } from "@/lib/server/stages/register-mcp-transaction-mutation-tools";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { handler,instructions,requireCommonTransaction,requireNonCreditAccount } from "./tool-support";

import type { AppDb } from "@/lib/db";

export function createPersonalFinanceMcpServer(database?: AppDb) {
  const server = new McpServer(
    { name: "personal-financial-control", version: "1.0.0" },
    { instructions }
  );

  registerMcpReadAndCreateTools({ server, handler, database, requireNonCreditAccount, requireCommonTransaction });

  registerMcpTransactionMutationTools({ server, handler, requireCommonTransaction, database, requireNonCreditAccount });

  registerMcpCreditCardTools({ server, handler, database });

  return server;
}

export { instructions as personalFinanceMcpInstructions };
