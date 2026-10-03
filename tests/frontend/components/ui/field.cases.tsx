import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldContent,
  FieldTitle,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
  FieldError,
} from "@/components/ui/field";
it("composes accessible fields and deduplicates errors", () => {
  const { rerender } = renderUI(
    <FieldSet>
      <FieldLegend>Conta</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldContent>
            <FieldTitle>Nome</FieldTitle>
            <FieldLabel htmlFor="field-name">Nome da conta</FieldLabel>
            <input id="field-name" />
            <FieldDescription>Use um nome curto</FieldDescription>
          </FieldContent>
        </Field>
        <FieldSeparator>ou</FieldSeparator>
      </FieldGroup>
    </FieldSet>,
  );
  expect(screen.getByLabelText("Nome da conta")).toBeVisible();
  expect(screen.getByText("Use um nome curto")).toBeVisible();
  rerender(
    <FieldError
      errors={[
        { message: "Nome obrigatório" },
        { message: "Nome obrigatório" },
      ]}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Nome obrigatório");
  expect(screen.queryByRole("list")).toBeNull();
  rerender(
    <FieldError
      errors={[{ message: "Nome" }, { message: "Valor" }, undefined, {}]}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  rerender(<FieldError errors={[]} />);
  expect(screen.queryByRole("alert")).toBeNull();
  rerender(<FieldError>Erro explícito</FieldError>);
  expect(screen.getByRole("alert")).toHaveTextContent("Erro explícito");
  rerender(
    <Field>
      <FieldLegend variant="label">Opção</FieldLegend>
      <FieldSeparator />
    </Field>,
  );
  expect(screen.getByText("Opção")).toHaveAttribute("data-variant", "label");
});
