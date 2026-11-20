import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type { UIMessage } from "ai";
import { ChatComposer } from "@/components/finance/chat/chat-composer";
import { ChatEmptyState } from "@/components/finance/chat/chat-empty-state";
import { ChatMessage } from "@/components/finance/chat/chat-message";
import { ChatToolStatus } from "@/components/finance/chat/chat-tool-status";
import { AppShell } from "@/components/finance/app-shell";
import { renderUI } from "../../helpers";

const user = { name: "Ana", photoURL: null };

function stubAvailability(configured: boolean) {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, configured }) });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

function shell(demoMode = false) {
  return renderUI(<AppShell demoMode={demoMode} user={user}><h1>Conteúdo</h1></AppShell>);
}

afterEach(() => { vi.unstubAllGlobals(); });

it("offers no chat in demo mode", () => {
  stubAvailability(true);
  shell(true);
  expect(screen.queryByRole("button", { name: "Abrir assistente" })).toBeNull();
});

it("explains how to configure the AI when no key is saved", async () => {
  stubAvailability(false);
  const { user: person } = shell();
  await person.click(screen.getAllByRole("button", { name: "Abrir assistente" })[0]);
  expect(await screen.findByText("Configure uma IA para usar o chat")).toBeVisible();
  expect(screen.getByRole("link", { name: "Configurações → IA" })).toHaveAttribute("href", "/settings");
  expect(screen.queryByRole("textbox", { name: "Mensagem" })).toBeNull();
});

it("shows the suggestions and sends a question when the AI is configured", async () => {
  const fetcher = stubAvailability(true);
  const { user: person } = shell();
  await person.click(screen.getAllByRole("button", { name: "Abrir assistente" })[0]);
  expect(await screen.findByText("Pergunte sobre suas finanças")).toBeVisible();
  expect(screen.getByText(/enviados ao provedor de IA/)).toBeVisible();
  await person.type(screen.getByRole("textbox", { name: "Mensagem" }), "Qual foi meu maior gasto?");
  await person.click(screen.getByRole("button", { name: "Enviar" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/ai/chat", expect.objectContaining({ method: "POST" })));
  expect(await screen.findByText("Qual foi meu maior gasto?")).toBeVisible();
});

it("closes the panel and clears the conversation with a new one", async () => {
  stubAvailability(true);
  const { user: person } = shell();
  await person.click(screen.getAllByRole("button", { name: "Abrir assistente" })[0]);
  await person.click(await screen.findByRole("button", { name: "Fechar chat" }));
  expect(screen.queryByTestId("chat-panel")).toBeNull();
});

it("describes a tool lookup in progress, finished and failed", () => {
  renderUI(<>
    <ChatToolStatus toolName="get_spending_summary" done={false} failed={false} />
    <ChatToolStatus toolName="get_budget_overview" done failed={false} />
    <ChatToolStatus toolName="unknown_tool" done={false} failed />
  </>);
  expect(screen.getByText("Consultando gastos…")).toBeVisible();
  expect(screen.getByText("Consultei orçamento")).toBeVisible();
  expect(screen.getByText("Não consegui consultar dados")).toBeVisible();
});

it("renders text and tool parts of a message, and ignores other parts", () => {
  const message = { id: "a1", role: "assistant", parts: [
    { type: "tool-get_spending_summary", toolCallId: "t", state: "output-available", input: {}, output: {} },
    { type: "text", text: "Foi o aluguel." },
    { type: "text", text: "" },
    { type: "step-start" },
  ] } as unknown as UIMessage;
  renderUI(<ChatMessage message={message} />);
  expect(screen.getByText("Foi o aluguel.")).toBeVisible();
  expect(screen.getByText("Consultei gastos")).toBeVisible();
});

it("sends a suggested question and with Enter, but not with Shift+Enter", async () => {
  const onPick = vi.fn();
  const onSend = vi.fn();
  const { user: person } = renderUI(<><ChatEmptyState disabled={false} onPick={onPick} /><ChatComposer busy={false} disabled={false} onSend={onSend} onStop={vi.fn()} /></>);
  await person.click(screen.getByRole("button", { name: "Ainda posso gastar este mês?" }));
  expect(onPick).toHaveBeenCalledWith("Ainda posso gastar este mês?");
  const box = screen.getByRole("textbox", { name: "Mensagem" });
  await person.type(box, "oi{Shift>}{Enter}{/Shift}tudo bem");
  expect(onSend).not.toHaveBeenCalled();
  await person.type(box, "{Enter}");
  expect(onSend).toHaveBeenCalledWith("oi\ntudo bem");
});

it("offers to stop while an answer is streaming", async () => {
  const onStop = vi.fn();
  const { user: person } = renderUI(<ChatComposer busy disabled={false} onSend={vi.fn()} onStop={onStop} />);
  await person.click(screen.getByRole("button", { name: "Parar resposta" }));
  expect(onStop).toHaveBeenCalled();
});
