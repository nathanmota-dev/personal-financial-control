import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import { CHAT_MAX_BODY_BYTES, CHAT_MAX_MESSAGES } from "@/lib/server/ai/chat-inputs";
import { streamChatResponse } from "@/lib/server/ai/chat";
import { createTestDatabase } from "@/tests/helpers/database";

const config: AiConfig = { provider: "anthropic", model: "claude-haiku-5-5", connection: { kind: "apiKey", apiKey: "sk-test-key-123456" } };
let database: Awaited<ReturnType<typeof createTestDatabase>>;

beforeEach(async () => { database = await createTestDatabase(); });
afterEach(async () => { await database.cleanup(); });

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };

function textModel(text: string) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: text },
          { type: "text-end", id: "t1" },
          { type: "finish", finishReason: { unified: "stop", raw: "stop" }, usage },
        ],
      }),
    }),
  });
}

function post(messages: unknown) {
  return new Request("http://localhost/api/ai/chat", { method: "POST", body: JSON.stringify({ messages }) });
}

const question = [{ id: "m1", role: "user", parts: [{ type: "text", text: "Qual foi meu maior gasto?" }] }];

describe("streamChatResponse", () => {
  it("streams the answer and gives the model only read-only tools and the dated prompt", async () => {
    const model = textModel("Foi o aluguel.");
    const response = await streamChatResponse(post(question), config, database.db, { model });
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toContain("Foi o aluguel.");

    const call = model.doStreamCalls[0];
    const names = (call.tools ?? []).map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining(["get_spending_summary", "get_spending_capacity"]));
    expect(names).not.toContain("create_transaction");
    expect(JSON.stringify(call.prompt)).toContain("Você é o assistente financeiro");
  });

  it("refuses when no AI configuration exists", async () => {
    await expect(streamChatResponse(post(question), null, database.db)).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED", status: 409 });
  });

  it("rejects an empty or oversized conversation", async () => {
    await expect(streamChatResponse(post([]), config, database.db, { model: textModel("x") })).rejects.toThrow();
    const many = Array.from({ length: CHAT_MAX_MESSAGES + 1 }, (_, index) => ({ id: `m${index}`, role: "user", parts: [{ type: "text", text: "oi" }] }));
    await expect(streamChatResponse(post(many), config, database.db, { model: textModel("x") })).rejects.toThrow();
  });

  it("rejects a body that is too large or not JSON", async () => {
    const huge = new Request("http://localhost/api/ai/chat", { method: "POST", body: "x".repeat(CHAT_MAX_BODY_BYTES + 1) });
    await expect(streamChatResponse(huge, config, database.db, { model: textModel("x") })).rejects.toMatchObject({ code: "CHAT_TOO_LARGE", status: 413 });
    const broken = new Request("http://localhost/api/ai/chat", { method: "POST", body: "{" });
    await expect(streamChatResponse(broken, config, database.db, { model: textModel("x") })).rejects.toThrow(SyntaxError);
  });

  it("hides provider error details from the stream", async () => {
    const model = new MockLanguageModelV4({ doStream: async () => { throw new Error("key sk-secret rejected"); } });
    const body = await (await streamChatResponse(post(question), config, database.db, { model })).text();
    expect(body).not.toContain("sk-secret");
    expect(body).toContain("Não foi possível obter a resposta");
  });
});
