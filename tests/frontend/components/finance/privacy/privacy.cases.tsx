import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { Suspense, useState } from "react";
import { FinancialPrivacyProvider } from "@/components/finance/privacy/privacy-provider";
import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { FinancialPrivacyContext, useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { MoneyInput } from "@/components/finance/money-input";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer } from "@/components/ui/chart";
import { ReportExportActions } from "@/components/finance/reports/export-actions";
import { CompoundInterestCalculator } from "@/components/finance/calculators/compound-interest-calculator";
import { createFinancialPrivacyStore, financialPrivacyKey } from "@/lib/financial-privacy";

function Values() {
  const { formatCurrency, formatCurrencyText, protect } = useFinancialFormatter();
  const [draft, setDraft] = useState("987,65");
  return <><FinancialPrivacyToggle /><p title={formatCurrencyText(98765)} aria-label={formatCurrencyText(98765)}>{formatCurrency(98765)} · {protect("123 unidades")}</p>
    <FinancialPrivacyForm><MoneyInput aria-label="Rascunho" value={draft} onValueChange={setDraft} /></FinancialPrivacyForm>
    <ChartContainer config={{}}><div data-testid="secret-chart">987,65</div></ChartContainer></>;
}

it("conceals server-rendered values and input contents before hydration even without a saved preference", () => {
  const html = renderToString(<FinancialPrivacyProvider demoMode><Values /></FinancialPrivacyProvider>);
  expect(html).toContain("Valor oculto");
  expect(html).not.toMatch(/987,65|123 unidades|secret-chart/);
});

it("conceals streamed fallback content before the financial shell is ready", () => {
  function PendingShell(): never { throw new Promise(() => {}); }
  const html = renderToString(<Suspense fallback={<p>Carregando dados financeiros.</p>}><FinancialPrivacyProvider demoMode><PendingShell /></FinancialPrivacyProvider></Suspense>);
  expect(html).toContain("Carregando dados financeiros.");
  expect(html).not.toMatch(/987,65|123 unidades|secret-chart/);
});

it("persists visibility, keeps drafts, masks titles and charts and isolates demo preferences", async () => {
  localStorage.setItem(financialPrivacyKey(false), "hidden");
  const { unmount } = render(<FinancialPrivacyProvider demoMode={false}><Values /></FinancialPrivacyProvider>);
  expect(screen.getByRole("button", { name: "Mostrar valores" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Mostrar valores" })).toHaveAttribute("aria-description", "Valores financeiros ocultos");
  expect(document.body.textContent).not.toContain("987,65");
  expect(screen.getAllByRole("img", { name: "Valor oculto" }).length).toBeGreaterThan(0);
  expect(screen.getByTitle("Valor oculto")).toHaveAttribute("aria-label", "Valor oculto");
  expect(screen.queryByTestId("secret-chart")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar valores para editar" }));
  fireEvent.change(screen.getByLabelText("Rascunho"), { target: { value: "12345" } });
  expect(screen.getByLabelText("Rascunho")).toHaveValue("123,45");
  expect(screen.getByTitle("Valor oculto")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar valores" }));
  expect(screen.getByTitle(/987,65/)).toBeVisible();
  expect(screen.getByTestId("secret-chart")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));
  expect(screen.queryByLabelText("Rascunho")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar valores para editar" }));
  expect(screen.getByLabelText("Rascunho")).toHaveValue("123,45");
  unmount();
  render(<FinancialPrivacyProvider demoMode><Values /></FinancialPrivacyProvider>);
  expect(screen.getByTitle(/987,65/)).toBeVisible();
  expect(localStorage.getItem(financialPrivacyKey(false))).toBe("hidden");
});

it("synchronizes storage changes and supports toggling with blocked storage", () => {
  const store = createFinancialPrivacyStore(true);
  const changed = vi.fn();
  const unsubscribe = store.subscribe(changed);
  expect(store.getSnapshot()).toBe(false);
  localStorage.setItem(financialPrivacyKey(true), "hidden");
  window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
  expect(changed).not.toHaveBeenCalled();
  window.dispatchEvent(new StorageEvent("storage", { key: financialPrivacyKey(true) }));
  expect(store.getSnapshot()).toBe(true);
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  expect(store.getSnapshot()).toBe(false);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  store.setHidden(true);
  window.dispatchEvent(new StorageEvent("storage", { key: financialPrivacyKey(true) }));
  expect(store.getSnapshot()).toBe(true);
  unsubscribe();
  const fresh = createFinancialPrivacyStore(false);
  expect(fresh.getSnapshot()).toBe(true);
  fresh.setHidden(true);
  expect(fresh.getSnapshot()).toBe(true);
  fresh.setHidden(false);
  expect(fresh.getSnapshot()).toBe(false);
});

it("reveals only the dialog and conceals it again after closing without changing the preference", () => {
  localStorage.setItem(financialPrivacyKey(true), "hidden");
  function FormDialog({ open }: { open: boolean }) {
    return <FinancialPrivacyProvider demoMode><p>Outside</p><Dialog open={open}><DialogContent><DialogTitle>Montante</DialogTitle><MoneyInput aria-label="Montante" defaultValue="987,65" /></DialogContent></Dialog></FinancialPrivacyProvider>;
  }
  const { rerender } = render(<FormDialog open />);
  expect(screen.queryByRole("textbox", { name: "Montante" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar valores para editar" }));
  expect(screen.getByRole("textbox", { name: "Montante" })).toHaveValue("987,65");
  rerender(<FormDialog open={false} />);
  rerender(<FormDialog open />);
  expect(screen.queryByRole("textbox", { name: "Montante" })).toBeNull();
  expect(localStorage.getItem(financialPrivacyKey(true))).toBe("hidden");
});

it("requires revealing values before export without initiating a request", () => {
  const setHidden = vi.fn();
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<FinancialPrivacyContext value={{ hidden: true, setHidden }}><ReportExportActions mode="monthly" period="2026-07" /></FinancialPrivacyContext>);
  expect(screen.queryByRole("button", { name: "Exportar resumo" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar valores para exportar" }));
  expect(setHidden).toHaveBeenCalledWith(false);
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("keeps calculators usable when all storage operations are unavailable", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
  render(<CompoundInterestCalculator />);
  await act(() => new Promise(resolve => setTimeout(resolve, 10)));
  for (const [name, value] of [["Valor inicial", "100000"], ["Valor mensal", "10000"], ["Taxa de juros", "0"], ["Período", "1"]]) {
    fireEvent.change(screen.getByLabelText(name), { target: { value } });
  }
  fireEvent.submit(screen.getByRole("button", { name: "Calcular" }).closest("form")!);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Valor total final")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
  expect(screen.queryByText("Valor total final")).toBeNull();
});
