import { useState } from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { renderUI } from "../helpers";
import { navigation } from "../setup";
import { createAccountAction } from "@/app/actions/finance";
import type { OnboardingState } from "@/lib/interfaces/onboarding";
import Flow from "@/components/finance/onboarding/flow";
import { OnboardingGate } from "@/components/finance/onboarding/gate";
import { Onboarding, ChoiceGroup, FeatureCarousel, TipsList, useOnboarding } from "@/components/ui/onboarding";

let saved: { id: string; name: string; type: string; initialBalanceCents: number; creditClosingDay: number | null; creditDueDay: number }[];
let state: OnboardingState;
let rejectProgress: boolean;
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (url === "/api/accounts") return Response.json({ ok: true, accounts: saved });
  if (rejectProgress) throw new Error("offline");
  if (init?.body) {
    const update = JSON.parse(String(init.body));
    state = update.completed ? { ...state, completedAt: "2026-10-03" } : { ...state, step: update.step };
  }
  return Response.json({ ok: true, onboarding: state });
});
beforeEach(() => {
  saved = [{ id: "old", name: "Conta anterior", type: "cash", initialBalanceCents: 0, creditClosingDay: null, creditDueDay: 10 }];
  state = { step: 1, completedAt: null };
  rejectProgress = false;
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(createAccountAction).mockImplementation(async input => {
    const account = { id: String(saved.length), ...input, initialBalanceCents: input.initialBalanceCents ?? 0, creditClosingDay: input.creditClosingDay ?? null, creditDueDay: input.creditDueDay ?? 10 };
    saved.push(account);
    return account as never;
  });
});

function Harness({ step = 1 }: { step?: number }) {
  const [current, setCurrent] = useState<OnboardingState>({ step, completedAt: null });
  return current.completedAt ? <p>Concluído</p> : <Flow state={current} name="Ana Lima" onStateChange={setCurrent} onDismiss={vi.fn()} />;
}

it("navigates, selects theme, saves multiple accounts and completes", async () => {
  const { user } = renderUI(<Harness />);
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.click(screen.getByLabelText("Escuro", { exact: true }));
  expect(localStorage.getItem("theme")).toBe("dark");
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByText("Conta anterior")).toBeVisible();
  await user.type(screen.getByLabelText("Nome da conta"), "Banco");
  fireEvent.change(screen.getByLabelText("Saldo inicial (R$)"), { target: { value: "123.45" } });
  await user.click(screen.getByRole("button", { name: "Salvar conta" }));
  expect(createAccountAction).toHaveBeenCalledWith({ name: "Banco", type: "checking", initialBalanceCents: 12345 });
  expect(await screen.findByText("Banco", { exact: true })).toBeVisible();
  await user.type(screen.getByLabelText("Nome da conta"), "Carteira");
  await user.selectOptions(screen.getByLabelText("Tipo de conta"), "cash");
  await user.click(screen.getByRole("button", { name: "Salvar conta" }));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.type(screen.getByLabelText("Nome do cartão"), "Visa");
  await user.type(screen.getByLabelText("Dia de fechamento"), "31");
  await user.type(screen.getByLabelText("Dia de vencimento"), "1");
  await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
  expect(createAccountAction).toHaveBeenLastCalledWith({ name: "Visa", type: "credit", initialBalanceCents: 0, creditClosingDay: 31, creditDueDay: 1 });
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  expect(screen.getByText(/3 conta\(s\) e 1/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Ir para o Dashboard" }));
  expect(await screen.findByText("Concluído")).toBeVisible();
  expect(navigation.push).toHaveBeenCalledWith("/dashboard");
});

it("keeps the current step on write failure and retries without recreating accounts", async () => {
  const { user } = renderUI(<Harness step={3} />);
  await screen.findByText("Conta anterior");
  rejectProgress = true;
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("progresso");
  expect(screen.getByText("Etapa 3 de 5")).toBeVisible();
  rejectProgress = false;
  await user.click(screen.getByRole("button", { name: "Pular etapa" }));
  expect(await screen.findByText("Etapa 4 de 5")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(await screen.findByText("Conta anterior")).toBeVisible();
  expect(createAccountAction).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Pular configuração" }));
  expect(await screen.findByText("Concluído")).toBeVisible();
});

it("validates names and card days, and recovers from failed account creation", async () => {
  const { user } = renderUI(<Harness step={4} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar cartão" })).toBeEnabled());
  await user.type(screen.getByLabelText("Nome do cartão"), "   ");
  await user.type(screen.getByLabelText("Dia de fechamento"), "32");
  await user.type(screen.getByLabelText("Dia de vencimento"), "0");
  await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
  expect(createAccountAction).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Dia de fechamento"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Dia de vencimento"), { target: { value: "10" } });
  await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Informe um nome");
  await user.type(screen.getByLabelText("Nome do cartão"), "Visa");
  vi.mocked(createAccountAction).mockRejectedValueOnce(new Error());
  await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar");
  await user.click(screen.getByRole("button", { name: "Salvar cartão" }));
  expect(await screen.findByText("Visa", { exact: true })).toBeVisible();
});

it("prevents repeated submissions and navigation during account creation", async () => {
  const { user } = renderUI(<Harness step={3} />);
  await screen.findByText("Conta anterior");
  let resolve!: (value: never) => void;
  vi.mocked(createAccountAction).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await user.type(screen.getByLabelText("Nome da conta"), "Banco");
  const form = screen.getByLabelText("Nome da conta").closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(createAccountAction).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  await act(async () => resolve({ ...saved[0], id: "new", name: "Banco" } as never));
  expect(await screen.findByText("Banco")).toBeVisible();
});

it("keeps the app accessible after an initial read failure and retries", async () => {
  const { user } = renderUI(<><p>App disponível</p><OnboardingGate initialState={null} name="Ana" /></>);
  rejectProgress = true;
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(screen.getByText("App disponível")).toBeVisible();
  rejectProgress = false;
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("dialog")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent(window, new Event("focus"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("recognizes completion from another tab and never reopens", async () => {
  renderUI(<OnboardingGate initialState={state} name="Ana" />);
  await screen.findByRole("dialog");
  state = { step: 5, completedAt: "today" };
  fireEvent(window, new Event("focus"));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  state = { step: 1, completedAt: null };
  fireEvent(window, new Event("focus"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("retries failed account loading", async () => {
  fetchMock.mockRejectedValueOnce(new Error());
  const { user } = renderUI(<Harness step={3} />);
  await user.click(await screen.findByRole("button", { name: "Recarregar cadastros" }));
  expect(await screen.findByText("Conta anterior")).toBeVisible();
});

function ContextProbe() { const context = useOnboarding(); return <p>{context.currentStep}:{context.stepValue}</p>; }
it("preserves Cult UI substeps, uncontrolled choices, tips and carousel keyboard navigation", async () => {
  const { user } = renderUI(<>
    <Onboarding totalSteps={2} maxStepValue={1}><ContextProbe /><Onboarding.Header><h2>Custom</h2></Onboarding.Header><Onboarding.Navigation /></Onboarding>
    <ChoiceGroup name="Teste"><ChoiceGroup.Item value="a">Escolha A</ChoiceGroup.Item></ChoiceGroup>
    <FeatureCarousel><FeatureCarousel.Item index={0}>Primeiro</FeatureCarousel.Item><FeatureCarousel.Item index={1}>Segundo</FeatureCarousel.Item></FeatureCarousel>
    <TipsList><TipsList.Item number={1}>Dica</TipsList.Item></TipsList>
  </>);
  await user.click(screen.getByRole("button", { name: "Next" })); expect(screen.getByText("1:1")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Back" })); expect(screen.getByText("1:0")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next" })); await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2:0")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Back" })); expect(screen.getByText("1:1")).toBeVisible();
  await user.click(screen.getByLabelText("Escolha A")); expect(screen.getByLabelText("Escolha A")).toBeChecked();
  const first = screen.getByRole("tab", { name: "Primeiro" });
  fireEvent.keyDown(first, { key: "ArrowRight" }); expect(screen.getByRole("tab", { name: "Segundo" })).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(first, { key: "ArrowLeft" }); expect(first).toHaveAttribute("aria-selected", "true");
  await user.click(screen.getByRole("tab", { name: "Segundo" }));
});
