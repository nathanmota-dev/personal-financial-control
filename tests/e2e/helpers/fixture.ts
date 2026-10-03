import { test as base, expect } from "@playwright/test";
import { startFinanceServer } from "./server";
import type { FinanceServer } from "./contracts";

export const test = base.extend<{ financeServer: FinanceServer }>({
  financeServer: async ({}, deliver, testInfo) => {
    const server = await startFinanceServer();
    try {
      await deliver(server);
    } finally {
      if (testInfo.status !== testInfo.expectedStatus)
        await testInfo.attach("finance-server.log", {
          body: server.logs(),
          contentType: "text/plain",
        });
      await server.close();
    }
  },
  baseURL: async ({ financeServer }, deliver) => {
    await deliver(financeServer.url);
  },
  extraHTTPHeaders: async ({ financeServer }, deliver) => {
    await deliver({ Origin: financeServer.url });
  },
  locale: "pt-BR",
  timezoneId: "UTC",
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-16T12:00:00Z"));
});
export { expect };
