import type { DemoFixture } from "@/lib/demo/contracts";
import { accountIds,categoryIds,id } from "./support";

export const creditCardCharges: DemoFixture["creditCardCharges"] = [
    {
      id: id("e0000000-0000-4000-8000", 1),
      accountId: accountIds.credit,
      categoryId: categoryIds.education,
      description: "Notebook para estudos",
      notes: "Compra parcelada",
      purchaseDate: "2026-05-18",
      totalAmountCents: 360000,
      installmentCount: 6,
      firstInvoiceMonth: "2026-06",
    },
    {
      id: id("e0000000-0000-4000-8000", 2),
      accountId: accountIds.credit,
      categoryId: categoryIds.leisure,
      description: "Passagens para férias",
      notes: "Viagem de fim de ano",
      purchaseDate: "2026-06-18",
      totalAmountCents: 240000,
      installmentCount: 4,
      firstInvoiceMonth: "2026-07",
    },
    {
      id: id("e0000000-0000-4000-8000", 3),
      accountId: accountIds.credit,
      categoryId: categoryIds.restaurants,
      description: "Experiência gastronômica",
      purchaseDate: "2026-04-15",
      totalAmountCents: 180000,
      installmentCount: 3,
      firstInvoiceMonth: "2026-05",
    },
  ];
