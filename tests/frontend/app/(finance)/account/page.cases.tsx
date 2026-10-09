import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Page from "@/app/(finance)/account/page";
import { AccountView } from "@/components/auth/account-view";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
import { navigation } from "@/tests/frontend/setup";

it("shows session identity with a locked email and returns to the previous route", async () => {
  vi.mocked(requirePageSession).mockResolvedValueOnce({ name: " Ana Maria Lima ", email: "ana@example.com", picture: null } as Awaited<ReturnType<typeof requirePageSession>>);
  const { user } = renderUI(await Page());
  expect(requirePageSession).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
  expect(screen.getByLabelText("Sobrenome")).toHaveValue("Maria Lima");
  expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
  expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
  vi.spyOn(window.history, "length", "get").mockReturnValue(2);
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(navigation.back).toHaveBeenCalledOnce();
});

it("handles a single name, missing email and direct entry", async () => {
  const { user } = renderUI(<AccountView user={{ name: "Ana", photoURL: null }} />);
  expect(screen.getByLabelText("Sobrenome")).toHaveValue("");
  expect(screen.getByLabelText("E-mail")).toHaveValue("");
  vi.spyOn(window.history, "length", "get").mockReturnValue(1);
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(navigation.replace).toHaveBeenCalledWith("/dashboard");
});

it("supports demo sessions without an email", async () => {
  vi.mocked(requirePageSession).mockResolvedValueOnce({ name: "Visitante demo", picture: null });
  renderUI(await Page());
  expect(screen.getByLabelText("Nome")).toHaveValue("Visitante");
  expect(screen.getByLabelText("E-mail")).toHaveValue("");
});

it("requires authentication before displaying account information", async () => {
  vi.mocked(requirePageSession).mockRejectedValueOnce(new Error("REDIRECT:/login"));
  await expect(Page()).rejects.toThrow("REDIRECT:/login");
});


it("saves edited names through the API and refreshes account identity", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  const { user } = renderUI(<AccountView user={{ name: "Ana Lima", email: "ana@example.com", photoURL: null }} />);
  await user.clear(screen.getByLabelText("Nome"));
  await user.type(screen.getByLabelText("Nome"), " Maria ");
  await user.clear(screen.getByLabelText("Sobrenome"));
  await user.type(screen.getByLabelText("Sobrenome"), "Silva");
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(fetcher).toHaveBeenCalledWith("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: "Maria", lastName: "Silva" }) });
  expect(await screen.findByRole("status")).toHaveTextContent("Nome de exibição atualizado.");
  expect(navigation.refresh).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
});

it.each([false, true])("preserves edits after save failure (network: %s)", async network => {
  const fetcher = vi.fn();
  if (network) fetcher.mockRejectedValue(new Error("offline"));
  else fetcher.mockResolvedValue({ ok: false });
  vi.stubGlobal("fetch", fetcher);
  const { user } = renderUI(<AccountView user={{ name: "Ana Lima", photoURL: null }} />);
  await user.type(screen.getByLabelText("Sobrenome"), " Silva");
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar");
  expect(screen.getByLabelText("Sobrenome")).toHaveValue("Lima Silva");
  expect(navigation.refresh).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
});

it("rejects whitespace-only names before requesting an update", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const { user } = renderUI(<AccountView user={{ name: "Ana", photoURL: null }} />);
  await user.clear(screen.getByLabelText("Nome"));
  await user.type(screen.getByLabelText("Nome"), "   ");
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Informe um nome válido");
  expect(fetcher).not.toHaveBeenCalled();
});
