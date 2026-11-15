import { waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, expect, it, vi } from "vitest";

import { PluggyDailySync } from "@/components/finance/open-finance/pluggy-daily-sync";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const dailyCalls = () => vi.mocked(fetch).mock.calls.filter(([path]) => path === "/api/pluggy/sync/daily");

function stubDaily(body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => json(body)));
}

afterEach(() => { vi.unstubAllGlobals(); });

it("asks for the daily sync once and refreshes the page after a run", async () => {
  stubDaily({ ok: true, ran: true, run: { status: "success" } });
  const view = renderUI(<PluggyDailySync demoMode={false} />);
  await waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
  expect(dailyCalls()).toEqual([["/api/pluggy/sync/daily", expect.objectContaining({ method: "POST" })]]);
  view.rerender(<PluggyDailySync demoMode={false} />);
  expect(dailyCalls()).toHaveLength(1);
});

it("stays quiet when today's sync already happened", async () => {
  stubDaily({ ok: true, ran: false, reason: "already-synced" });
  const success = vi.spyOn(toast, "success");
  renderUI(<PluggyDailySync demoMode={false} />);
  await waitFor(() => expect(dailyCalls()).toHaveLength(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(navigation.refresh).not.toHaveBeenCalled();
  expect(success).not.toHaveBeenCalled();
});

it("warns when the automatic run failed", async () => {
  stubDaily({ ok: true, ran: true, run: { status: "failed" } });
  const error = vi.spyOn(toast, "error");
  renderUI(<PluggyDailySync demoMode={false} />);
  await waitFor(() => expect(error).toHaveBeenCalledWith(expect.stringContaining("falhou")));
  expect(navigation.refresh).not.toHaveBeenCalled();
});

it("never calls the API in demo mode", async () => {
  stubDaily({ ok: true, ran: false, reason: "no-items" });
  renderUI(<PluggyDailySync demoMode />);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(dailyCalls()).toHaveLength(0);
});

it("ignores a locked session instead of redirecting from the background", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 423 })));
  const assign = vi.fn();
  vi.stubGlobal("window", new Proxy(window, { get: (target, key) => key === "location" ? { href: target.location.href, assign } : Reflect.get(target, key, target) }));
  renderUI(<PluggyDailySync demoMode={false} />);
  await waitFor(() => expect(dailyCalls()).toHaveLength(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(assign).not.toHaveBeenCalled();
  expect(navigation.refresh).not.toHaveBeenCalled();
});
