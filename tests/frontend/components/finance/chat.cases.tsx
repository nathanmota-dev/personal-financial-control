import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import type { UIMessage } from "ai";
import { ChatComposer } from "@/components/finance/chat/chat-composer";
import { ChatMarkdown } from "@/components/finance/chat/chat-markdown";
import { ChatLauncher } from "@/components/finance/chat/chat-launcher";
import { ChatSetupNotice } from "@/components/finance/chat/chat-setup-notice";
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

it("offers the chat in demo mode but asks for an LLM provider without calling the API", async () => {
  const fetcher = stubAvailability(true);
  const { user: person } = shell(true);
  await person.click(screen.getByRole("button", { name: "Abrir assistente" }));
  expect(await screen.findByText("Configure um provider de LLM para usar o chat")).toBeVisible();
  expect(screen.queryByRole("textbox", { name: "Mensagem" })).toBeNull();
  expect(fetcher).not.toHaveBeenCalledWith("/api/ai/chat", expect.anything());
});

it("explains how to configure the AI when no key is saved", async () => {
  stubAvailability(false);
  const { user: person } = shell();
  await person.click(screen.getAllByRole("button", { name: "Abrir assistente" })[0]);
  expect(await screen.findByText("Configure um provider de LLM para usar o chat")).toBeVisible();
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

it("hides the floating button while the chat is open and brings it back focused when it closes", async () => {
  stubAvailability(true);
  const { user: person } = shell();
  const launchers = screen.getAllByRole("button", { name: "Abrir assistente" });
  expect(launchers).toHaveLength(1);
  expect(launchers[0]).toHaveClass("fixed", "rounded-full", "bg-primary");
  expect(launchers[0]).toHaveTextContent("");
  await person.click(launchers[0]);
  expect(await screen.findByTestId("chat-panel")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Abrir assistente" })).toBeNull();
  await person.click(screen.getByRole("button", { name: "Fechar chat" }));
  expect(screen.queryByTestId("chat-panel")).toBeNull();
  expect(screen.getByRole("button", { name: "Abrir assistente" })).toHaveFocus();
});

it("renders the assistant's Markdown as formatted text", () => {
  const reply = [
    "## Resumo",
    "O maior gasto foi um **Pix de R$ 1.110,00** em *11/11*.",
    "",
    "* **1º:** aluguel",
    "* ~~2º~~ mercado",
    "",
    "1. Primeiro",
    "",
    "| Categoria | Valor |",
    "| --- | --- |",
    "| Energia | R$ 500,00 |",
    "",
    "Use `get_budget_overview`. [Fonte](https://example.com) [x](javascript:alert(1))",
    "",
    "<b>cru</b> ![logo](https://example.com/a.png)",
  ].join("\n");
  const { container } = renderUI(<ChatMarkdown text={reply} />);
  expect(screen.getByRole("heading", { level: 3, name: "Resumo" })).toBeVisible();
  expect(screen.getByText("Pix de R$ 1.110,00").tagName).toBe("STRONG");
  expect(screen.getByText("11/11").tagName).toBe("EM");
  expect(container.textContent).not.toContain("**");
  expect(screen.getAllByRole("list")).toHaveLength(2);
  expect(screen.getByText("2º").tagName).toBe("DEL");
  expect(screen.getByRole("columnheader", { name: "Categoria" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "R$ 500,00" })).toBeVisible();
  expect(screen.getByText("get_budget_overview").tagName).toBe("CODE");
  expect(screen.getByRole("link", { name: "Fonte" })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByRole("link", { name: "Fonte" })).toHaveAttribute("target", "_blank");
  expect(screen.getByText("x").getAttribute("href") ?? "").not.toContain("javascript");
  expect(container.querySelector("b")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
});

it("renders the remaining Markdown blocks: headings, quotes, rules and code blocks", () => {
  const reply = ["# Título", "### Seção", "#### Detalhe", "> Citação", "", "---", "", "```", "total = 10", "```"].join("\n");
  const { container } = renderUI(<ChatMarkdown text={reply} />);
  expect(screen.getByRole("heading", { level: 3, name: "Título" })).toBeVisible();
  expect(screen.getByRole("heading", { level: 4, name: "Seção" })).toBeVisible();
  expect(screen.getByRole("heading", { level: 4, name: "Detalhe" })).toBeVisible();
  expect(screen.getByText("Citação").closest("blockquote")).not.toBeNull();
  expect(container.querySelector("hr")).not.toBeNull();
  expect(screen.getByText("total = 10").closest("pre")).not.toBeNull();
});

it("renders no launcher outside the chat provider", () => {
  renderUI(<ChatLauncher />);
  expect(screen.queryByRole("button", { name: "Abrir assistente" })).toBeNull();
});

it("tells while the AI configuration is loading or unavailable", () => {
  const { rerender } = renderUI(<ChatSetupNotice availability="loading" />);
  expect(screen.getByRole("status")).toHaveTextContent("Verificando a configuração de IA…");
  rerender(<ChatSetupNotice availability="unavailable" />);
  expect(screen.getByRole("status")).toHaveTextContent("O chat não está disponível agora.");
});

it("keeps the user's own text literal and renders the assistant's as Markdown", () => {
  const message = (role: "user" | "assistant", text: string) => ({ id: role, role, parts: [{ type: "text", text }] }) as unknown as UIMessage;
  renderUI(<><ChatMessage message={message("user", "**literal**")} /><ChatMessage message={message("assistant", "**negrito**")} /></>);
  expect(screen.getByText("**literal**")).toBeVisible();
  expect(screen.getByText("negrito").tagName).toBe("STRONG");
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
