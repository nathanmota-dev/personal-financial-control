import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
it("marks the current page and keeps navigation destinations", () => {
  renderUI(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3">3</PaginationLink>
        </PaginationItem>
        <PaginationEllipsis />
        <PaginationItem>
          <PaginationNext href="?page=3" text="Próxima" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
  expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute(
    "href",
    "?page=3",
  );
  expect(screen.getByRole("link", { name: "3" })).not.toHaveAttribute(
    "aria-current",
  );
});
