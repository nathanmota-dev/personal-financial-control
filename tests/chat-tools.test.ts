import { describe, expect, it } from "vitest";

import { captureMcpTools } from "@/lib/chat/capture-mcp-tools";
import { buildChatTools } from "@/lib/chat/tools";
import { createTestDatabase } from "@/tests/helpers/database";

describe("chat tools", () => {
  it("offers only the tools the MCP flags as read-only", () => {
    const readOnly = captureMcpTools().filter((tool) => tool.readOnly).map((tool) => tool.name).sort();
    expect(Object.keys(buildChatTools()).sort()).toEqual(readOnly);
    expect(readOnly).toEqual(expect.arrayContaining(["get_spending_summary", "get_budget_overview", "list_transactions"]));
  });

  it("never exposes a tool that writes", () => {
    const names = Object.keys(buildChatTools());
    for (const writer of ["create_transaction", "update_transaction", "delete_transaction", "create_credit_card_charge", "update_credit_card_charge", "delete_credit_card_charge", "apply_pending_category", "create_category"]) {
      expect(names).not.toContain(writer);
    }
  });

  it("runs a tool and returns the MCP envelope", async () => {
    const { db } = await createTestDatabase();
    const tools = buildChatTools(db);
    const result = await (tools.list_finance_references.execute as (input: unknown, options: unknown) => Promise<unknown>)({}, { toolCallId: "t1", messages: [], context: {} });
    expect(result).toMatchObject({ ok: true, data: { accounts: expect.any(Array), categories: expect.any(Array) } });
  });
});
