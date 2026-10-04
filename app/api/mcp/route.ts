import { apiGuard } from "@/lib/auth/server";
import { handleMcpRequest } from "@/lib/mcp/http";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";

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

export const POST = privateRoute(handlePOST);

export const GET = privateRoute(handleGET);

export const DELETE = privateRoute(handleDELETE);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
