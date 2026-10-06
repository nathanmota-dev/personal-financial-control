import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportExportActions } from "@/components/finance/reports/export-actions";
import { renderUI } from "@/tests/frontend/helpers";

describe("explicit report downloads", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:report-csv");
      static revokeObjectURL = vi.fn();
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("\uFEFFCompetência;Receitas\r\n2026-07;100,00\r\n", { headers: { "Content-Type": "text/csv; charset=utf-8" } })));
  });

  it.each([
    ["summary", "Exportar resumo", "monthly", "2026-07", "relatorio-resumo-mensal-2026-07.csv"],
    ["categories", "Exportar categorias", "annual", "2026", "relatorio-categorias-anual-2026.csv"],
  ] as const)("downloads %s only after a click with the selected period", async (kind, label, mode, period, filename) => {
    let downloaded = "";
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { downloaded = this.download; });
    const { user } = renderUI(<ReportExportActions mode={mode} period={period} />);
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: label }));
    expect(fetch).toHaveBeenCalledWith(`/api/reports/export?mode=${mode}&period=${period}&kind=${kind}`, { cache: "no-store", credentials: "same-origin", redirect: "error" });
    expect(click).toHaveBeenCalledOnce();
    expect(downloaded).toBe(filename);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    expect(screen.getByRole("button", { name: label })).toBeEnabled();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report-csv"), { timeout: 2000 });
  });

  it("disables both buttons until the complete CSV is received", async () => {
    let resolveBlob!: (blob: Blob) => void;
    const response = new Response("csv", { headers: { "Content-Type": "text/csv" } });
    vi.spyOn(response, "blob").mockImplementation(() => new Promise((resolve) => { resolveBlob = resolve; }));
    vi.mocked(fetch).mockResolvedValueOnce(response);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { user } = renderUI(<ReportExportActions mode="monthly" period="2026-07" />);
    await user.click(screen.getByRole("button", { name: "Exportar resumo" }));
    expect(screen.getByRole("button", { name: "Gerando resumo…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar categorias" })).toBeDisabled();
    expect(click).not.toHaveBeenCalled();
    await act(async () => resolveBlob(new Blob(["csv"])));
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Exportar resumo" })).toBeEnabled();
  });

  it.each(["500", "401", "HTML", "missing MIME", "empty", "network", "interrupted body"])("shows %s errors without downloading, and allows retry", async (failure) => {
    const response = new Response(failure === "empty" ? "" : "error", {
      status: failure === "500" ? 500 : failure === "401" ? 401 : 200,
      headers: failure === "missing MIME" ? {} : { "Content-Type": failure === "HTML" ? "text/html" : "text/csv" },
    });
    if (failure === "interrupted body") vi.spyOn(response, "blob").mockRejectedValueOnce(new Error("interrupted"));
    if (failure === "network") vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    else vi.mocked(fetch).mockResolvedValueOnce(response);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { user } = renderUI(<ReportExportActions mode="monthly" period="2026-07" />);
    await user.click(screen.getByRole("button", { name: "Exportar resumo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível exportar");
    expect(click).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Exportar resumo" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Exportar resumo" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(click).toHaveBeenCalledOnce();
  });
});
