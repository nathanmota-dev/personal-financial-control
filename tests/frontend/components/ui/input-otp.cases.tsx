import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { renderUI } from "../../helpers";
it("edits a bounded verification code and renders its characters", async () => {
  const change = vi.fn();
  const { user, container } = renderUI(
    <InputOTP maxLength={4} aria-label="Código" onChange={change}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>,
  );
  await user.type(screen.getByRole("textbox", { name: "Código" }), "12345");
  expect(screen.getByRole("textbox")).toHaveValue("1234");
  expect(change).toHaveBeenLastCalledWith("1234");
  expect(
    container.querySelectorAll('[data-slot="input-otp-slot"]'),
  ).toHaveLength(4);
  expect(screen.getByRole("separator")).toBeVisible();
});
it("disables code entry while verification is pending", () => {
  renderUI(
    <InputOTP maxLength={4} disabled aria-label="Código">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
      </InputOTPGroup>
    </InputOTP>,
  );
  expect(screen.getByRole("textbox")).toBeDisabled();
});
