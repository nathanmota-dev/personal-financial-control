import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const creditCardInstallments: DemoFixture["creditCardInstallments"] = [
    ...["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"].map(
      (invoiceMonth, index) => ({
        id: id("f0000000-0000-4000-8000", index + 1),
        chargeId: id("e0000000-0000-4000-8000", 1),
        installmentNumber: index + 1,
        amountCents: 60000,
        invoiceMonth,
      })
    ),
    ...["2026-07", "2026-08", "2026-09", "2026-10"].map((invoiceMonth, index) => ({
      id: id("f0000000-0000-4000-8001", index + 1),
      chargeId: id("e0000000-0000-4000-8000", 2),
      installmentNumber: index + 1,
      amountCents: 60000,
      invoiceMonth,
    })),
    ...["2026-05", "2026-06", "2026-07"].map((invoiceMonth, index) => ({
      id: id("f0000000-0000-4000-8002", index + 1),
      chargeId: id("e0000000-0000-4000-8000", 3),
      installmentNumber: index + 1,
      amountCents: 60000,
      invoiceMonth,
    })),
  ];
