import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@/components/ui/native-select";
it("retains native selection and option groups", async () => {
  const change = vi.fn();
  const { user, rerender } = renderUI(
    <NativeSelect aria-label="Conta" onChange={change}>
      <NativeSelectOptGroup label="Contas">
        <NativeSelectOption value="one">Principal</NativeSelectOption>
        <NativeSelectOption value="two">Reserva</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>,
  );
  await user.selectOptions(screen.getByRole("combobox"), "two");
  expect(screen.getByRole("combobox")).toHaveValue("two");
  expect(change).toHaveBeenCalledOnce();
  rerender(<NativeSelect size="sm" disabled aria-label="Conta" />);
  expect(screen.getByRole("combobox")).toBeDisabled();
});
