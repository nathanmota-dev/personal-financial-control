import type { AppDb } from "@/lib/db";
import type { McpToolRegistrar } from "@/lib/interfaces/mcp-tool-registrar";
import { handler, requireCommonTransaction, requireNonCreditAccount } from "@/lib/mcp/tool-support";
import { registerMcpCategoryTools } from "@/lib/server/stages/register-mcp-category-tools";
import { registerMcpCreditCardTools } from "@/lib/server/stages/register-mcp-credit-card-tools";
import { registerMcpInsightTools } from "@/lib/server/stages/register-mcp-insight-tools";
import { registerMcpReadAndCreateTools } from "@/lib/server/stages/register-mcp-read-and-create-tools";
import { registerMcpTransactionMutationTools } from "@/lib/server/stages/register-mcp-transaction-mutation-tools";

/** Every MCP tool, registered in one place so the MCP server and the chat can never drift apart. */
export function registerAllMcpTools(server: McpToolRegistrar, database?: AppDb) {
  registerMcpReadAndCreateTools({ server, handler, database, requireNonCreditAccount, requireCommonTransaction });
  registerMcpTransactionMutationTools({ server, handler, requireCommonTransaction, database, requireNonCreditAccount });
  registerMcpCreditCardTools({ server, handler, database });
  registerMcpCategoryTools({ server, handler, database });
  registerMcpInsightTools({ server, handler, database });
}
