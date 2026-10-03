import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";

function MobileIndicator() {
  return <span>{String(useIsMobile())}</span>;
}

describe("mobile breakpoint", () => {
  it("updates on media changes and removes the exact listener on unmount", () => {
    const addEventListener = vi.fn(),
      removeEventListener = vi.fn();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList);
    vi.stubGlobal("innerWidth", 768);
    const { result, unmount } = renderHook(useIsMobile);
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    vi.stubGlobal("innerWidth", 767);
    act(() => addEventListener.mock.calls[0][1]());
    expect(result.current).toBe(true);
    vi.stubGlobal("innerWidth", 1024);
    act(() => addEventListener.mock.calls[0][1]());
    expect(result.current).toBe(false);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      addEventListener.mock.calls[0][1],
    );
  });
  it("returns the desktop fallback during SSR", () => {
    vi.stubGlobal("window", undefined);
    expect(renderToString(<MobileIndicator />)).toContain("false");
  });
});
