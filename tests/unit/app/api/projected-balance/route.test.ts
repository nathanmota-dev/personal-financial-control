import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../helpers/route";
import * as route from "@/app/api/projected-balance/route";
import { getFinanceDatabase } from "@/lib/db";

routeDatabase();
guardCases(route);
it("calculates real daily balances and rejects invalid query parameters", async () => {
  const response = await route.GET(
    request("GET", undefined, "?period=next_30_days&startDate=2026-07-16"),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).daily).toHaveLength(30);
  expect(
    (await route.GET(request("GET", undefined, "?period=invalid"))).status,
  ).toBe(400);
  expect(
    (
      await route.GET(
        request(
          "GET",
          undefined,
          "?period=custom&startDate=2026-07-16&endDate=2026-07-01",
        ),
      )
    ).status,
  ).toBe(400);
});
it.each([new Error("offline"), "unknown"])(
  "reports unexpected calculation failures: %s",
  async (error) => {
    vi.mocked(getFinanceDatabase).mockRejectedValueOnce(error);
    const response = await route.GET(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatchObject({
      code: "PROJECTED_BALANCE_ERROR",
      message:
        error instanceof Error ? "offline" : "Unknown projected balance error.",
    });
  },
);
