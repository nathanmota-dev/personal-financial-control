import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

export const navigation = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  pathname: "/dashboard",
  search: new URLSearchParams(),
};
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

class TestResizeObserver implements ResizeObserver {
  private disconnected = false;
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    queueMicrotask(() => {
      if (this.disconnected) return;
      const rect = target.getBoundingClientRect();
      this.callback(
        [
          {
            target,
            contentRect: rect,
            borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
            contentBoxSize: [
              { inlineSize: rect.width, blockSize: rect.height },
            ],
            devicePixelContentBoxSize: [],
          },
        ] as ResizeObserverEntry[],
        this,
      );
    });
  }
  unobserve() {
    this.disconnected = true;
  }
  disconnect() {
    this.disconnected = true;
  }
}

beforeEach(() => {
  navigation.pathname = "/dashboard";
  navigation.search = new URLSearchParams();
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 1024, 400),
  );
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: vi.fn(() => document.activeElement),
  });
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.cookie = "sidebar_state=; Max-Age=0";
  window.localStorage.clear();
});
