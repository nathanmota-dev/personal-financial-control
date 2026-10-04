import type { AppDb } from "@/lib/db";
import {
creditCardBills,
creditCardCharges,
creditCardInstallments
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import {
normalizeCompetenceMonth
} from "@/lib/server/finance";
import { and,eq,inArray } from "drizzle-orm";
import { resolveDb,serializeCreditCardCharge } from "./validation";

export async function getCreditCardCharge(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  const charge = await db.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.id, id),
    with: {
      account: true,
      category: true,
      installments: {
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
  });

  invariant(charge, "CREDIT_CARD_CHARGE_NOT_FOUND", "Credit card purchase does not exist.", 404);

  return serializeCreditCardCharge(
    charge,
    charge.account,
    charge.category,
    charge.installments
  );
}

export async function listCreditCardCharges(
  options: { accountId?: string; invoiceMonth?: string } = {},
  database?: AppDb
) {
  const db = await resolveDb(database);
  const normalizedMonth = options.invoiceMonth
    ? normalizeCompetenceMonth(options.invoiceMonth)
    : undefined;
  const chargeRows = await db.query.creditCardCharges.findMany({
    where: options.accountId ? eq(creditCardCharges.accountId, options.accountId) : undefined,
    with: {
      account: true,
      category: true,
      installments: {
        where: normalizedMonth
          ? eq(creditCardInstallments.invoiceMonth, normalizedMonth)
          : undefined,
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
    orderBy: (table, { desc: orderDesc }) => [
      orderDesc(table.purchaseDate),
      orderDesc(table.createdAt),
    ],
  });

  return chargeRows.map((charge) =>
    serializeCreditCardCharge(charge, charge.account, charge.category, charge.installments)
  );
}

export async function assertChargeCanMutate(id: string, database: AppDb) {
  const charge = await dbGetCharge(id, database);
  const installmentRows = await database.query.creditCardInstallments.findMany({
    where: eq(creditCardInstallments.chargeId, id),
  });
  const invoiceMonths = installmentRows.map((installment) => installment.invoiceMonth);

  if (!invoiceMonths.length) {
    return charge;
  }

  const paidBill = await database.query.creditCardBills.findFirst({
    where: and(
      eq(creditCardBills.accountId, charge.accountId),
      eq(creditCardBills.status, "paid"),
      inArray(creditCardBills.invoiceMonth, invoiceMonths)
    ),
  });

  invariant(
    !paidBill,
    "CREDIT_CARD_CHARGE_BILL_PAID",
    "Purchases belonging to a paid credit card bill cannot be changed."
  );

  return charge;
}

export async function dbGetCharge(id: string, database: AppDb) {
  const charge = await database.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.id, id),
  });

  invariant(charge, "CREDIT_CARD_CHARGE_NOT_FOUND", "Credit card purchase does not exist.", 404);

  return charge;
}
