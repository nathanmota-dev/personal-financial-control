import { apiGuard } from "@/lib/auth/server";
import { handleMcpRequest } from "@/lib/mcp/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return handleMcpRequest(request);
}

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return handleMcpRequest(request);
}

async function handleDELETE(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return handleMcpRequest(request);
}

export async function POST(...args: Parameters<typeof handlePOST>) {
  const response = await handlePOST(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(...args: Parameters<typeof handleGET>) {
  const response = await handleGET(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function DELETE(...args: Parameters<typeof handleDELETE>) {
  const response = await handleDELETE(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function HEAD(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
export async function OPTIONS(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
