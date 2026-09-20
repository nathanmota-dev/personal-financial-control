import { timingSafeEqual } from "node:crypto";

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import type { AppDb } from "@/lib/db";
import { createPersonalFinanceMcpServer } from "@/lib/mcp/server";

function jsonRpcError(status: number, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id: null }, { status });
}

function isLoopbackHost(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;
  const hostName = host.startsWith("[") ? host.slice(1, host.indexOf("]")) : host.split(":")[0];
  const allowed = new Set(["127.0.0.1", "localhost", "::1"]);
  return allowed.has(hostName.toLowerCase()) && allowed.has(hostname);
}

function authorized(request: Request, token: string) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice(7));
  const expected = Buffer.from(token);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function handleMcpRequest(request: Request, database?: AppDb) {
  if (request.method !== "POST") {
    return jsonRpcError(405, -32600, "Method not allowed; use POST.");
  }
  const token = process.env.PFC_MCP_TOKEN;
  if (!token || token.length < 32) {
    return jsonRpcError(503, -32000, "MCP is disabled.");
  }
  if (!isLoopbackHost(request)) {
    return jsonRpcError(403, -32001, "Host is not allowed.");
  }
  if (!authorized(request, token)) {
    return jsonRpcError(401, -32002, "Unauthorized.");
  }

  const server = createPersonalFinanceMcpServer(database);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
