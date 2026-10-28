import { act, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionActivity } from "@/components/auth/session-activity";
import { renderUI } from "../../helpers";
function prepare() {
  vi.useFakeTimers();
  const replace = vi.fn();
  vi.stubGlobal("window", new Proxy(window, { get: (target, key) => key === "location" ? { replace, pathname: "/goals", search: "" } : Reflect.get(target, key, target) }));
  const fetcher = vi.fn().mockResolvedValue({ status: 200 });
  vi.stubGlobal("fetch", fetcher);
  return { replace, fetcher };
}
describe("inactivity locking", () => {
  it("renews active one-minute sessions before their deadline and locks after inactivity", async () => {
    const { replace, fetcher } = prepare();
    renderUI(<SessionActivity timeoutMinutes={1} />);
    await act(async () => { fireEvent.keyDown(window); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); fireEvent.keyDown(window); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(11000); fireEvent.keyDown(window); });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(replace).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(61000); });
    expect(fetcher).toHaveBeenCalledWith("/api/session/activity", expect.objectContaining({ method: "DELETE" }));
    expect(replace).toHaveBeenCalledWith("/lock?next=%2Fgoals");
  });
  it("throttles normal heartbeats to a minute and redirects expired identities", async () => {
    const { replace, fetcher } = prepare();
    renderUI(<SessionActivity timeoutMinutes={15} />);
    await act(async () => { fireEvent.scroll(window); });
    await act(async () => { await vi.advanceTimersByTimeAsync(31000); fireEvent.keyDown(window); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockResolvedValue({ status: 401 });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); fireEvent.keyDown(window); });
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fgoals");
  });
});
