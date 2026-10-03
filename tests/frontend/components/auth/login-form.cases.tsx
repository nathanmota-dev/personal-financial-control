import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { googleLogin } from "@/lib/auth/client";
import { renderUI } from "../../helpers";

vi.mock("@/lib/auth/client", () => ({ googleLogin: vi.fn() }));

describe("Google login form", () => {
  it("offers the chosen demo destination", () => {
    renderUI(<LoginForm demoMode destination="/goals" />);
    expect(screen.getByRole("link", { name: "Explorar demo" })).toHaveAttribute(
      "href",
      "/goals",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("prevents concurrent login and keeps the busy state while navigating", async () => {
    let finish!: () => void;
    vi.mocked(googleLogin).mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const assign = vi.fn();
    const originalWindow = window;
    vi.stubGlobal(
      "window",
      new Proxy(originalWindow, {
        get: (target, key) =>
          key === "location"
            ? { assign, hostname: "localhost" }
            : Reflect.get(target, key, target),
      }),
    );
    renderUI(
      <LoginForm demoMode={false} destination="/transactions?month=2026-07" />,
    );
    const button = screen.getByRole("button", { name: "Continuar com Google" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(googleLogin).toHaveBeenCalledOnce());
    finish();
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("/transactions?month=2026-07"),
    );
    expect(screen.getByRole("button", { name: "Entrando…" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
  it("shows Firebase failures and permits another attempt", async () => {
    vi.mocked(googleLogin).mockRejectedValue({
      code: "auth/popup-closed-by-user",
    });
    const { user } = renderUI(
      <LoginForm demoMode={false} destination="/dashboard" />,
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("status")).not.toHaveTextContent(/^$/),
    );
    expect(screen.getByRole("button")).toBeEnabled();
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(googleLogin).toHaveBeenCalledTimes(2));
  });
});
