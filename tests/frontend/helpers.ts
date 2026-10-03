import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ReactElement } from "react";
import { Providers } from "@/components/providers";

export function renderUI(element: ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(element, { wrapper: Providers }),
  };
}

export function freezeFinanceDate() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));
}
