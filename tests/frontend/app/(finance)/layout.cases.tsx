import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import Layout from "@/app/(finance)/layout";
import { requirePageSession } from "@/lib/auth/server";
it.each([
  { name: "Ana Lima", picture: "/ana.jpg" },
  { name: "", picture: 42 },
  { name: undefined, picture: null },
])("normalizes session presentation %j", async (session) => {
  vi.mocked(requirePageSession).mockResolvedValueOnce(session as never);
  renderUI(await Layout({ children: <h1>Minha página</h1> }));
  expect(screen.getByRole("heading", { name: "Minha página" })).toBeVisible();
  if (!session.name)
    expect(screen.getAllByText("Usuário").length).toBeGreaterThan(0);
  else expect(screen.getAllByText(session.name).length).toBeGreaterThan(0);
});
