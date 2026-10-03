import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
it("keeps the account identity available when an image cannot load", async () => {
  renderUI(
    <AvatarGroup>
      <Avatar size="sm">
        <AvatarImage src="/missing.jpg" alt="Visitante" />
        <AvatarFallback>VD</AvatarFallback>
        <AvatarBadge aria-label="Online" />
      </Avatar>
      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>,
  );
  expect(await screen.findByText("VD")).toBeVisible();
  expect(screen.getByLabelText("Online")).toHaveAttribute(
    "data-slot",
    "avatar-badge",
  );
  expect(screen.getByText("+2")).toBeVisible();
});
