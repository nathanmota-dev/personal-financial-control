import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxItem,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxValue,
  ComboboxTrigger,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
} from "@/components/ui/combobox";
it("searches options, handles empty results, selects and clears the choice", async () => {
  const change = vi.fn();
  const items = ["Principal", "Reserva"];
  const { user } = renderUI(
    <Combobox items={items} onValueChange={change}>
      <ComboboxInput aria-label="Buscar conta" showClear />
      <ComboboxContent>
        <ComboboxEmpty>Nenhuma conta</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup>
            <ComboboxLabel>Contas</ComboboxLabel>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>
          <ComboboxSeparator />
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  await user.type(screen.getByRole("combobox"), "Reserva");
  await user.click(await screen.findByRole("option", { name: "Reserva" }));
  expect(change).toHaveBeenCalledWith("Reserva", expect.anything());
  expect(screen.getByRole("combobox")).toHaveValue("Reserva");
  await user.clear(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "zzzz");
  expect(await screen.findByText("Nenhuma conta")).toBeVisible();
});
it("renders a select-only trigger with its current value", async () => {
  const { user } = renderUI(
    <Combobox items={["Principal", "Reserva"]} defaultValue="Principal">
      <ComboboxTrigger>
        <ComboboxValue />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem value="Principal">Principal</ComboboxItem>
          <ComboboxItem value="Reserva">Reserva</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );
  screen.getByRole("combobox").focus();
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: "Reserva" }));
  expect(screen.getByRole("combobox")).toHaveTextContent("Reserva");
});
it("removes selected chips from a multiple selection", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <Combobox
      multiple
      items={["Principal", "Reserva"]}
      defaultValue={["Principal", "Reserva"]}
      onValueChange={change}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(values: string[]) =>
            values.map((value) => (
              <ComboboxChip key={value}>{value}</ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput aria-label="Adicionar conta" />
      </ComboboxChips>
    </Combobox>,
  );
  const chip = screen
    .getByText("Principal")
    .closest('[data-slot="combobox-chip"]')!;
  await user.click(within(chip as HTMLElement).getByRole("button"));
  expect(change).toHaveBeenCalledWith(["Reserva"], expect.anything());
  expect(screen.queryByText("Principal")).toBeNull();
});
