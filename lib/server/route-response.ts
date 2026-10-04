import { apiGuard } from "@/lib/auth/server";

/** Keep private financial responses out of shared and browser caches. */
export function privateRoute<TArgs extends unknown[], TResponse extends Response>(
  handler: (...args: TArgs) => Promise<TResponse>
) {
  return async (...args: TArgs): Promise<TResponse> => {
    const response = await handler(...args);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
}

/** Authenticate unsupported methods before disclosing route availability. */
export async function rejectRouteMethod(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, {
    status: 405,
    headers: { "Cache-Control": "private, no-store" },
  });
}
