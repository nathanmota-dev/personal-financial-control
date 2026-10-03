import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import Page from "@/app/login/page";
it.each([true, false])(
  "presents the login mode and sanitizes destination (demo %s)",
  async (demo) => {
    vi.stubEnv("DEMO_MODE", String(demo));
    renderUI(
      await Page({
        searchParams: Promise.resolve({ next: "https://external.example/" }),
      }),
    );
    expect(screen.getByRole("heading", { name: /Seu dinheiro/ })).toBeVisible();
    if (demo)
      expect(
        screen.getByRole("link", { name: "Explorar demo" }),
      ).toHaveAttribute("href", "/dashboard");
    else expect(screen.getByRole("button", { name: /Google/ })).toBeVisible();
  },
);
