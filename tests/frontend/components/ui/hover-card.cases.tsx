import { screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
it("reveals linked information on hover", async () => {
  const { user } = renderUI(
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <a href="/help">Ajuda contextual</a>
      </HoverCardTrigger>
      <HoverCardContent>Detalhes adicionais</HoverCardContent>
    </HoverCard>,
  );
  await user.hover(screen.getByRole("link"));
  expect(await screen.findByText("Detalhes adicionais")).toBeVisible();
  await user.unhover(screen.getByRole("link"));
  await waitFor(() =>
    expect(screen.queryByText("Detalhes adicionais")).toBeNull(),
  );
});
