import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
it("retains table associations and financial totals", () => {
  renderUI(
    <Table>
      <TableCaption>Movimentos</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Conta</TableHead>
          <TableHead scope="col">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Principal</TableCell>
          <TableCell>R$ 20,00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>R$ 20,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
  expect(screen.getByRole("table", { name: "Movimentos" })).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getByRole("columnheader", { name: "Saldo" })).toHaveAttribute(
    "scope",
    "col",
  );
  expect(screen.getByRole("cell", { name: "Principal" })).toBeVisible();
});
