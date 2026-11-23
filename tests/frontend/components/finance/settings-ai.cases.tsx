import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsAiPanel } from "@/components/finance/settings/settings-ai-panel";
import type { AiSettingsView } from "@/lib/interfaces/ai-settings";
import { chooseOption, renderUI } from "@/tests/frontend/helpers";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const empty: AiSettingsView = { provider: null, model: null, connection: null, source: null };
const masked = (keyMasked: string) => ({ kind: "apiKey", keyMasked }) as const;
const ollama = { kind: "local", baseUrl: "http://localhost:11434" } as const;

type Call = { method: string; body: unknown };
type Side = { models?: () => Response; check?: () => Response };

/** Requests to the models and check endpoints, kept apart from the settings calls each test asserts. */
let sideCalls: { url: string; body: unknown }[] = [];

function stubApi(initial: AiSettingsView, reply: (call: Call) => Response = () => json({ ok: true, settings: initial }), side: Side = {}) {
  const calls: Call[] = [];
  sideCalls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET") return json({ ok: true, settings: initial });
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.endsWith("/models") || url.endsWith("/check")) {
      sideCalls.push({ url, body });
      const answer = url.endsWith("/models") ? side.models : side.check;
      return answer ? answer() : json({ ok: true, models: [] });
    }
    const call = { method, body };
    calls.push(call);
    return reply(call);
  }));
  return calls;
}

const save = () => screen.getByRole("button", { name: "Salvar configuração" });

describe("components/finance/settings/settings-ai-panel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts off and saves a hand-typed model with its key", async () => {
    const saved: AiSettingsView = { provider: "openai", model: "gpt-custom-1", connection: masked("••••5678"), source: "app" };
    const calls = stubApi(empty, () => json({ ok: true, settings: saved }));
    const { user } = renderUI(<SettingsAiPanel />);
    expect(await screen.findByText(/está desligada/)).toBeVisible();
    expect(save()).toBeDisabled();
    await chooseOption(user, screen.getByRole("combobox", { name: "Provedor" }), "OpenAI");
    await chooseOption(user, screen.getByRole("combobox", { name: "Modelo" }), "Outro…");
    await user.type(screen.getByRole("textbox", { name: "ID do modelo" }), "gpt-custom-1");
    expect(save()).toBeDisabled();
    const keyInput = screen.getByLabelText("API key");
    expect(keyInput).toHaveAttribute("type", "password");
    await user.type(keyInput, "sk-secret-5678");
    await user.click(screen.getByRole("button", { name: "Mostrar chave" }));
    expect(keyInput).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar chave" }));
    expect(keyInput).toHaveAttribute("type", "password");
    await user.click(save());
    expect(calls).toEqual([{ method: "PUT", body: { provider: "openai", model: "gpt-custom-1", connection: { kind: "apiKey", apiKey: "sk-secret-5678" } } }]);
    expect(await screen.findByText("Configuração da IA salva.")).toBeVisible();
    expect(screen.getByText("OpenAI · gpt-custom-1")).toBeVisible();
    expect(screen.getByLabelText("API key")).toHaveValue("••••5678");
    expect(screen.getByLabelText("API key")).toHaveAttribute("readonly");
  });

  it("explains an environment setup and asks for a key to save it in the app", async () => {
    stubApi({ provider: "google", model: "gemini-3.6-flash", connection: masked("••••wxyz"), source: "env" });
    const { user } = renderUI(<SettingsAiPanel />);
    expect(await screen.findByText(/Configurado via \.env \(Google Gemini · gemini-3\.6-flash\)/)).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Modelo" })).toHaveTextContent("Gemini 3.6 Flash");
    expect(screen.getByLabelText("API key")).toHaveAttribute("placeholder", "Cole a chave do provedor");
    expect(save()).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();
    await user.type(screen.getByLabelText("API key"), "x");
    expect(save()).toBeEnabled();
  });

  it("keeps the stored key, shows a custom model and removes the configuration", async () => {
    const stored: AiSettingsView = { provider: "google", model: "gemini-9-test", connection: masked("••••abcd"), source: "app" };
    const calls = stubApi(stored, (call) => json({ ok: true, settings: call.method === "DELETE" ? empty : stored }));
    const { user } = renderUI(<SettingsAiPanel />);
    expect(await screen.findByRole("textbox", { name: "ID do modelo" })).toHaveValue("gemini-9-test");
    expect(screen.getByLabelText("API key")).toHaveValue("••••abcd");
    expect(screen.getByText("Chave salva e criptografada. Só o final dela é exibido.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Trocar" }));
    await user.type(screen.getByLabelText("Nova API key"), "sk-typed-then-cancelled");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByLabelText("API key")).toHaveValue("••••abcd");
    await user.click(save());
    await waitFor(() => expect(calls[0]).toEqual({ method: "PUT", body: { provider: "google", model: "gemini-9-test" } }));
    await user.click(await screen.findByRole("button", { name: "Remover" }));
    expect(await screen.findByText("Configuração da IA removida.")).toBeVisible();
    expect(calls[1]).toEqual({ method: "DELETE", body: undefined });
    expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();
  });

  it("asks for a new key after switching provider and keeps the saved one when switching back", async () => {
    const calls = stubApi({ provider: "google", model: "gemini-3.6-flash", connection: masked("••••abcd"), source: "app" });
    const { user } = renderUI(<SettingsAiPanel />);
    await chooseOption(user, await screen.findByRole("combobox", { name: "Provedor" }), "Anthropic Claude");
    await chooseOption(user, screen.getByRole("combobox", { name: "Modelo" }), "Claude Haiku 5.5");
    expect(screen.getByLabelText("API key")).toHaveAttribute("placeholder", "Cole a chave do provedor");
    expect(save()).toBeDisabled();
    await user.type(screen.getByLabelText("API key"), "sk-anthropic-key");
    await chooseOption(user, screen.getByRole("combobox", { name: "Provedor" }), "Google Gemini");
    await chooseOption(user, screen.getByRole("combobox", { name: "Modelo" }), "Gemini 3.8 Flash");
    expect(screen.getByLabelText("API key")).toHaveValue("••••abcd");
    await user.click(save());
    await waitFor(() => expect(calls[0]).toEqual({ method: "PUT", body: { provider: "google", model: "gemini-3.8-flash" } }));
  });

  it("lists the models of a local Ollama, asks for its address instead of a key and saves it", async () => {
    const saved: AiSettingsView = { provider: "ollama", model: "qwen3:8b", connection: ollama, source: "app" };
    const calls = stubApi(empty, () => json({ ok: true, settings: saved }), {
      models: () => json({ ok: true, models: [{ id: "gemma3:12b", label: "gemma3:12b" }, { id: "qwen3:8b", label: "qwen3:8b" }] }),
    });
    const { user } = renderUI(<SettingsAiPanel />);
    await chooseOption(user, await screen.findByRole("combobox", { name: "Provedor" }), "Ollama (local)");
    expect(screen.queryByLabelText("API key")).toBeNull();
    expect(screen.getByLabelText("URL do servidor")).toHaveValue("http://localhost:11434");
    expect(await screen.findByText("2 modelos instalados no servidor.")).toBeVisible();
    expect(sideCalls).toEqual([{ url: "/api/ai/settings/models", body: { provider: "ollama", connection: ollama } }]);
    await chooseOption(user, screen.getByRole("combobox", { name: "Modelo" }), "qwen3:8b");
    await user.click(save());
    await waitFor(() => expect(calls).toEqual([{ method: "PUT", body: { provider: "ollama", model: "qwen3:8b", connection: ollama } }]));
    expect(await screen.findByText("Ollama (local) · qwen3:8b em http://localhost:11434")).toBeVisible();
  });

  it("reads the models of a saved Ollama again for a new address and shows why a listing failed", async () => {
    let reachable = true;
    stubApi({ provider: "ollama", model: "llama3.1:8b", connection: ollama, source: "app" }, undefined, {
      models: () => reachable
        ? json({ ok: true, models: [{ id: "qwen3:8b", label: "qwen3:8b" }] })
        : json({ ok: false, error: { code: "AI_MODELS_UNAVAILABLE", message: "Não foi possível listar os modelos." } }, 502),
    });
    const { user } = renderUI(<SettingsAiPanel />);
    expect(await screen.findByText("1 modelo instalado no servidor.")).toBeVisible();
    // The saved model is not installed any more, but it stays selected instead of vanishing.
    expect(screen.getByRole("combobox", { name: "Modelo" })).toHaveTextContent("llama3.1:8b");
    reachable = false;
    const url = screen.getByLabelText("URL do servidor");
    await user.clear(url);
    await user.type(url, "http://gpu-box:11434{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível listar os modelos.");
    expect(sideCalls.at(-1)).toEqual({ url: "/api/ai/settings/models", body: { provider: "ollama", connection: { kind: "local", baseUrl: "http://gpu-box:11434" } } });
    reachable = true;
    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(await screen.findByText("1 modelo instalado no servidor.")).toBeVisible();
    await user.clear(url);
    await user.tab();
    await chooseOption(user, screen.getByRole("combobox", { name: "Provedor" }), "OpenAI");
    expect(screen.getByLabelText("API key")).toBeVisible();
  });

  it("says when a local server has no model installed", async () => {
    stubApi({ provider: "ollama", model: "qwen3:8b", connection: ollama, source: "env" });
    renderUI(<SettingsAiPanel />);
    expect(await screen.findByText(/Nenhum modelo instalado/)).toBeVisible();
    expect(screen.getByText(/Configurado via \.env \(Ollama \(local\) · qwen3:8b em http:\/\/localhost:11434\)/)).toBeVisible();
  });

  it("checks the connection with the saved key without saving anything", async () => {
    let works = true;
    const calls = stubApi({ provider: "google", model: "gemini-3.6-flash", connection: masked("••••abcd"), source: "app" }, undefined, {
      check: () => works ? json({ ok: true }) : json({ ok: false, error: { code: "AI_CHECK_FAILED", message: "O provedor não respondeu. Confira a conexão e o modelo." } }, 502),
    });
    const { user } = renderUI(<SettingsAiPanel />);
    await user.click(await screen.findByRole("button", { name: "Testar conexão" }));
    expect(await screen.findByText("Conexão funcionando: o modelo respondeu.")).toBeVisible();
    expect(sideCalls).toEqual([{ url: "/api/ai/settings/check", body: { provider: "google", model: "gemini-3.6-flash" } }]);
    works = false;
    await user.click(screen.getByRole("button", { name: "Testar conexão" }));
    expect(await screen.findByText("O provedor não respondeu. Confira a conexão e o modelo.")).toBeVisible();
    expect(calls).toEqual([]);
  });

  it("reports load and save failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ ok: false, error: { code: "X", message: "Falha ao carregar a IA." } }, 500)));
    renderUI(<SettingsAiPanel />);
    expect(await screen.findByText("Falha ao carregar a IA.")).toBeVisible();
    vi.unstubAllGlobals();
    stubApi(empty, () => json({ ok: false, error: { code: "AI_API_KEY_REQUIRED", message: "Informe a API key do provedor escolhido." } }, 400));
    const { user } = renderUI(<SettingsAiPanel />);
    await chooseOption(user, (await screen.findAllByRole("combobox", { name: "Provedor" }))[0], "DeepSeek");
    await chooseOption(user, screen.getByRole("combobox", { name: "Modelo" }), "DeepSeek Flash");
    await user.type(screen.getByLabelText("API key"), "sk-deepseek-key");
    await user.click(save());
    expect(await screen.findByText("Informe a API key do provedor escolhido.")).toBeVisible();
    expect(screen.getByLabelText("API key")).toHaveValue("sk-deepseek-key");
  });
});
