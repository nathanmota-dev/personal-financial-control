import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoneyInput } from "@/components/finance/money-input";
import { renderUI } from "../../helpers";

describe("money input interactions", () => {
  it("formats default values and notifies both callback contracts", () => {
    const onValueChange = vi.fn(),
      onChange = vi.fn();
    renderUI(
      <MoneyInput
        aria-label="Valor"
        defaultValue="12"
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Valor" });
    expect(input).toHaveValue("12,00");
    fireEvent.change(input, { target: { value: "12345" } });
    expect(input).toHaveValue("123,45");
    expect(onValueChange).toHaveBeenCalledWith("123,45");
    expect(onChange).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
  });
  it("uses controlled values and reports changes and pasted currency", () => {
    const onValueChange = vi.fn(),
      onChange = vi.fn(),
      onPaste = vi.fn();
    const { rerender } = renderUI(
      <MoneyInput
        aria-label="Valor"
        value="10,00"
        onValueChange={onValueChange}
        onChange={onChange}
        onPaste={onPaste}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.paste(input, { clipboardData: { getData: () => "R$ 1.234,56" } });
    expect(onPaste).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("1.234,56");
    expect(onChange).toHaveBeenCalled();
    rerender(<MoneyInput value="42,00" />);
    expect(input).toHaveValue("42,00");
  });
  it("honors a prevented paste and works without optional callbacks", () => {
    const { rerender } = renderUI(
      <MoneyInput
        defaultValue=""
        onPaste={(event) => event.preventDefault()}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.paste(input, { clipboardData: { getData: () => "100" } });
    expect(input).toHaveValue("");
    rerender(<MoneyInput />);
    fireEvent.change(input, { target: { value: "1" } });
    expect(input).toHaveValue("0,01");
    fireEvent.paste(input, { clipboardData: { getData: () => "2,00" } });
    expect(input).toHaveValue("2,00");
  });
});
