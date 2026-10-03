import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Wallet } from "lucide-react";
import { renderUI } from "../../helpers";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";

it.each(["dot", "line", "dashed"] as const)(
  "shows labelled financial tooltip values with %s indicators",
  (indicator) => {
    const { container } = renderUI(
      <ChartContainer
        id="finance"
        config={{
          income: { label: "Receitas", color: "#008800" },
          expense: {
            label: "Despesas",
            theme: { light: "#cc0000", dark: "#ff6666" },
          },
        }}
      >
        <div>
          <ChartTooltipContent
            active
            label="income"
            indicator={indicator}
            payload={
              [
                {
                  name: "income",
                  dataKey: "income",
                  value: 1234,
                  color: "green",
                  payload: { fill: "green" },
                },
                {
                  name: "expense",
                  value: "R$ 50,00",
                  payload: { kind: "expense" },
                },
              ] as never
            }
          />
          <ChartLegendContent
            payload={
              [
                { dataKey: "income", value: "income", color: "green" },
                { dataKey: "expense", value: "expense", type: "none" },
              ] as never
            }
          />
        </div>
      </ChartContainer>,
    );
    expect(screen.getAllByText("Receitas").length).toBeGreaterThan(0);
    expect(screen.getByText("R$ 50,00")).toBeVisible();
    expect(container.querySelector("style")).toHaveTextContent(
      "--color-income: #008800",
    );
    expect(container.querySelector("style")).toHaveTextContent(".dark");
  },
);
it("supports configured icons, nested labels and custom formatters", () => {
  const formatter = vi.fn(() => <strong>Saldo formatado</strong>),
    labelFormatter = vi.fn(() => "Competência");
  const { rerender } = renderUI(
    <ChartContainer config={{ money: { label: "Patrimônio", icon: Wallet } }}>
      <div>
        <ChartTooltipContent
          active
          indicator="line"
          labelKey="kind"
          nameKey="kind"
          payload={
            [{ name: "raw", value: 20, payload: { kind: "money" } }] as never
          }
        />
        <ChartLegendContent
          nameKey="kind"
          verticalAlign="top"
          payload={[{ value: "money", kind: "money", color: "green" }] as never}
        />
      </div>
    </ChartContainer>,
  );
  expect(screen.getAllByText("Patrimônio").length).toBeGreaterThan(0);
  rerender(
    <ChartContainer config={{ money: { label: "Patrimônio", icon: Wallet } }}>
      <div>
        <ChartTooltipContent
          active
          label="money"
          formatter={formatter}
          labelFormatter={labelFormatter}
          payload={[{ name: "money", value: 20 }] as never}
        />
        <ChartLegendContent
          hideIcon
          payload={
            [{ value: "money", dataKey: "money", color: "green" }] as never
          }
        />
      </div>
    </ChartContainer>,
  );
  expect(screen.getByText("Saldo formatado")).toBeVisible();
  expect(screen.getByText("Competência")).toBeVisible();
  expect(formatter).toHaveBeenCalledWith(
    20,
    "money",
    expect.any(Object),
    0,
    undefined,
  );
});
it.each([undefined, [], [{ name: "unknown", value: null, type: "none" }]])(
  "handles inactive, empty or hidden series %j",
  (payload) => {
    const { container } = renderUI(
      <ChartContainer config={{}}>
        <div>
          <ChartTooltipContent active={false} payload={payload as never} />
          <ChartTooltipContent
            active
            hideLabel
            hideIndicator
            payload={payload as never}
          />
          <ChartLegendContent payload={payload as never} />
        </div>
      </ChartContainer>,
    );
    expect(screen.queryByText("unknown")).toBeNull();
    expect(container.querySelector("style")).toBeNull();
  },
);
it("accepts string values, unknown labels and direct payload label keys", () => {
  renderUI(
    <ChartContainer config={{ balance: { label: "Saldo" } }}>
      <div>
        <ChartTooltipContent
          active
          indicator="dashed"
          labelKey="series"
          nameKey="series"
          payload={
            [{ series: "balance", value: "100", color: "green" }] as never
          }
        />
        <ChartTooltipContent
          active
          hideIndicator
          label=""
          payload={[{ name: "Sem configuração", value: undefined }] as never}
        />
      </div>
    </ChartContainer>,
  );
  expect(screen.getByText("100")).toBeVisible();
  expect(screen.getByText("Sem configuração")).toBeVisible();
});
it("rejects tooltips and legends without their chart context", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => renderUI(<ChartTooltipContent />)).toThrow(
    "useChart must be used",
  );
  expect(() => renderUI(<ChartLegendContent />)).toThrow(
    "useChart must be used",
  );
});
it("omits CSS for a colourless chart", () => {
  const { container } = renderUI(
    <ChartStyle id="uncoloured" config={{ value: { label: "Valor" } }} />,
  );
  expect(container.querySelector("style")).toBeNull();
});
