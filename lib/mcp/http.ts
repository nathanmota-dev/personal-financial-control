import { apiGuard, authResponse } from "@/lib/auth/server";
import { verifyMcpToken } from "@/lib/auth/mcp-token";
import { isDemoMode } from "@/lib/demo/mode";

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
  return allowed.has(hostName.toLowerCase()) && allowed.has(hostname.replace(/^\[|\]$/g, ""));
}

export async function handleMcpRequest(request: Request, database?: AppDb) {
  if (request.method !== "POST") {
    return jsonRpcError(405, -32600, "Method not allowed; use POST.");
  }
  if (!isLoopbackHost(request)) {
    return jsonRpcError(403, -32001, "Host is not allowed.");
  }

  if (isDemoMode()) {
    const denied = await apiGuard(request);
    if (denied) return denied;
  } else {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return jsonRpcError(403, -32001, "Origin is not allowed.");
    try {
      if (!await verifyMcpToken(request.headers.get("authorization"))) return jsonRpcError(401, -32001, "Invalid bearer token.");
    } catch (error) { return authResponse(error); }
  }
  const server = createPersonalFinanceMcpServer(database);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
