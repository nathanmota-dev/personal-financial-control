import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { AppLocaleProvider, useAppLocale } from "@/components/i18n/app-locale-provider";
import { LocaleDomBridge } from "@/components/i18n/locale-dom-bridge";
import type { Locale } from "@/lib/i18n/locale";
import { getIntlMessages } from "@/lib/i18n/messages";
import { navigation } from "../setup";

function LocaleControl() {
  const { locale, setLocale } = useAppLocale();

  return (
    <>
      <output>{locale}</output>
      <button type="button" onClick={() => setLocale(locale === "pt" ? "en" : "pt")}>
        Toggle locale
      </button>
    </>
  );
}

function CatalogHarness() {
  const [locale, setLocale] = useState<Locale>("en");
  const messages = getIntlMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <h1>Visão mensal</h1>
      <p data-user-content>Receitas</p>
      <button aria-label="Abrir preferências da conta" type="button" />
      <button type="button" onClick={() => setLocale(locale === "en" ? "pt" : "en")}>
        Change catalog
      </button>
      <LocaleDomBridge />
    </NextIntlClientProvider>
  );
}

describe("application locale provider", () => {
  it("uses a valid local preference when no preference cookie exists", async () => {
    document.cookie = "locale=; Max-Age=0; path=/";
    window.localStorage.setItem("locale", "en");

    render(
      <AppLocaleProvider initialLocale="pt" initialMessages={getIntlMessages("pt")}>
        <LocaleControl />
      </AppLocaleProvider>,
    );

    await waitFor(() => expect(screen.getByText("en")).toBeVisible());
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(navigation.refresh).toHaveBeenCalled();
  });

  it("prefers the cookie and persists a language change without navigation", async () => {
    document.cookie = "locale=en; path=/";
    window.localStorage.setItem("locale", "pt");

    render(
      <AppLocaleProvider initialLocale="pt" initialMessages={getIntlMessages("pt")}>
        <LocaleControl />
      </AppLocaleProvider>,
    );

    await waitFor(() => expect(screen.getByText("en")).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Toggle locale" }));

    await waitFor(() => expect(screen.getByText("pt")).toBeVisible());
    expect(window.localStorage.getItem("locale")).toBe("pt");
    expect(document.cookie).toContain("locale=pt");
    expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("keeps the server-readable cookie when browser storage is unavailable", async () => {
    document.cookie = "locale=; Max-Age=0; path=/";
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    render(
      <AppLocaleProvider initialLocale="pt" initialMessages={getIntlMessages("pt")}>
        <LocaleControl />
      </AppLocaleProvider>,
    );

    await waitFor(() => expect(document.cookie).toContain("locale=pt"));
    expect(screen.getByText("pt")).toBeVisible();
  });
});

describe("locale DOM bridge", () => {
  it("translates static UI, accessible text, and placeholders while preserving user content", async () => {
    const { container } = render(<CatalogHarness />);

    expect(screen.getByRole("heading", { name: "Monthly view" })).toBeVisible();
    const preferencesButton = screen.getByLabelText("Open account preferences");
    expect(preferencesButton).toBeInTheDocument();
    const userContent = container.querySelector("[data-user-content]");
    expect(userContent).toHaveTextContent("Receitas");
    preferencesButton.setAttribute("title", "Abrir preferências da conta");
    await waitFor(() => expect(preferencesButton).toHaveAttribute("title", "Open account preferences"));
    userContent?.setAttribute("title", "Receitas");
    await waitFor(() => expect(userContent).toHaveAttribute("title", "Receitas"));

    const dynamic = document.createElement("p");
    dynamic.textContent = "3 conta(s) e 2 cartão(ões) disponíveis no Finance.";
    container.append(dynamic);
    await waitFor(() =>
      expect(dynamic).toHaveTextContent("3 account(s) and 2 card(s) available in Finance."),
    );

    fireEvent.click(screen.getByRole("button", { name: "Change catalog" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Visão mensal" })).toBeVisible());
    expect(screen.getByRole("button", { name: "Abrir preferências da conta" })).toBeInTheDocument();
  });
});
