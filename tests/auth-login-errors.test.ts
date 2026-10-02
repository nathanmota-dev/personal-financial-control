import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "@/lib/auth/login-errors";

describe("Google login error messages", () => {
  it.each(["auth/popup-closed-by-user", "auth/cancelled-popup-request"])("offers manual retry after %s", code => {
    expect(loginErrorMessage({ code }, "localhost")).toBe("Login cancelado. Você pode tentar novamente.");
  });

  it.each(["localhost", "127.0.0.1"])("identifies the actual unauthorized hostname %s", hostname => {
    const message = loginErrorMessage({ code: "auth/unauthorized-domain" }, hostname);
    expect(message).toContain(`O domínio ${hostname} não está autorizado`);
    expect(message).toContain(`Adicione ${hostname} em Authentication > Settings > Authorized domains`);
    expect(message).toContain("recarregue a tela");
    expect(message).toContain("tente novamente");
  });

  it("explains popup blocking", () => {
    expect(loginErrorMessage({ code: "auth/popup-blocked" }, "localhost")).toContain("Permita popups");
  });

  it.each([{ code: "auth/network-request-failed" }, new TypeError("Failed to fetch")])("explains connection failures", failure => {
    expect(loginErrorMessage(failure, "localhost")).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
  });

  it("retains the server's actionable error", () => {
    expect(loginErrorMessage(new Error("Esta conta não tem permissão para acessar."), "localhost"))
      .toBe("Esta conta não tem permissão para acessar.");
  });

  it.each([null, undefined, "failure", { code: null }, { code: 1 }, { code: "constructor" }, { code: "toString" }])("handles unexpected rejection values safely", failure => {
    expect(loginErrorMessage(failure, "localhost")).toBe("Não foi possível entrar. Tente novamente.");
  });
});
