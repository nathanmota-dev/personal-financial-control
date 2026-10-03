import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogoutButton } from "@/components/auth/logout-button";
import { renderUI } from "../../helpers";

describe("logout", () => {
  it.each([false, true])(
    "ends the session (all devices: %s) and navigates",
    async (allDevices) => {
      const fetcher = vi.fn().mockResolvedValue({ ok: true }),
        assign = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      vi.stubGlobal(
        "window",
        new Proxy(window, {
          get: (target, key) =>
            key === "location" ? { assign } : Reflect.get(target, key, target),
        }),
      );
      const { user } = renderUI(
        <LogoutButton allDevices={allDevices} iconOnly={allDevices} />,
      );
      await user.click(screen.getByRole("button"));
      await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
      expect(fetcher).toHaveBeenCalledWith(
        allDevices ? "/api/session/revoke" : "/api/session",
        {
          method: allDevices ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          ...(allDevices ? { body: "{}" } : {}),
        },
      );
      expect(screen.getByRole("button", { name: "Saindo…" })).toBeDisabled();
    },
  );
  it.each([new Error("offline"), "network failure", { ok: false }])(
    "reports failure and restores the button: %j",
    async (failure) => {
      const fetcher = vi.fn();
      if (failure && typeof failure === "object" && "ok" in failure)
        fetcher.mockResolvedValue(failure);
      else fetcher.mockRejectedValue(failure);
      vi.stubGlobal("fetch", fetcher);
      const { user } = renderUI(<LogoutButton iconOnly />);
      await user.click(screen.getByRole("button"));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          failure instanceof Error
            ? "offline"
            : typeof failure === "string"
              ? "Falha de conexão."
              : "Não foi possível sair. Tente novamente.",
        ),
      );
      expect(screen.getByRole("button", { name: "Sair" })).toBeEnabled();
    },
  );
});
