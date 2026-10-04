import type { AppDb } from "@/lib/db";
import {
creditCardCharges,
creditCardInstallments
} from "@/lib/db/schema";
import { getAccountById } from "@/lib/server/accounts";
import { invariant } from "@/lib/server/errors";
import {
currentTimestamp,
normalizeCompetenceMonth,
normalizeDate,
serializeTimestamps,
} from "@/lib/server/finance";
import { eq } from "drizzle-orm";
import { assertChargeCanMutate,getCreditCardCharge } from "./queries";
import { CreateCreditCardChargeInput,createCreditCardChargeSchema,resolveDb,resolveFirstInvoiceMonth,serializeCreditCardCharge,shiftMonth,splitInstallmentAmounts,UpdateCreditCardChargeInput,updateCreditCardChargeSchema,validateCreditCardChargeDependencies } from "./validation";

export async function createCreditCardCharge(
  input: CreateCreditCardChargeInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = createCreditCardChargeSchema.parse(input);
  values.purchaseDate = normalizeDate(values.purchaseDate);

  if (values.importFingerprint) {
    const existing = await db.query.creditCardCharges.findFirst({
      where: eq(creditCardCharges.importFingerprint, values.importFingerprint),
    });

    if (existing) {
      const normalizedFirstInvoiceMonth = values.firstInvoiceMonth
        ? normalizeCompetenceMonth(values.firstInvoiceMonth)
        : resolveFirstInvoiceMonth(values.purchaseDate, (await getAccountById(values.accountId, db)).creditClosingDay as number);
      const samePayload =
        existing.accountId === values.accountId &&
        existing.categoryId === values.categoryId &&
        existing.description === values.description &&
        existing.notes === (values.notes ?? null) &&
        existing.purchaseDate === values.purchaseDate &&
        existing.totalAmountCents === values.totalAmountCents &&
        existing.installmentCount === values.installmentCount &&
        existing.kind === values.kind &&
        existing.firstInvoiceMonth === normalizedFirstInvoiceMonth;
      invariant(
        samePayload,
        "IDEMPOTENCY_KEY_CONFLICT",
        "The idempotency key is already associated with a different credit card charge payload."
      );
      return getCreditCardCharge(existing.id, db);
    }
  }

  const { account, category } = await validateCreditCardChargeDependencies(values, db);
  const firstInvoiceMonth = values.firstInvoiceMonth
    ? normalizeCompetenceMonth(values.firstInvoiceMonth)
    : resolveFirstInvoiceMonth(values.purchaseDate, account.creditClosingDay as number);
  const installmentAmounts = splitInstallmentAmounts(
    values.totalAmountCents,
    values.installmentCount
  );

  return db.transaction(async (tx) => {
    const [charge] = await tx
      .insert(creditCardCharges)
      .values({
        ...values,
        importFingerprint: values.importFingerprint ?? null,
        firstInvoiceMonth,
        updatedAt: currentTimestamp(),
      })
      .returning();

    const installments = await tx
      .insert(creditCardInstallments)
      .values(
        installmentAmounts.map((amountCents, index) => ({
          chargeId: charge.id,
          installmentNumber: index + 1,
          amountCents,
          invoiceMonth: shiftMonth(firstInvoiceMonth, index),
          updatedAt: currentTimestamp(),
        }))
      )
      .returning();

    return {
      ...serializeTimestamps(charge),
      account: serializeTimestamps(account),
      category: serializeTimestamps(category),
      installments: installments.map(serializeTimestamps),
    };
  });
}

export async function createIdempotentCreditCardCharge(
  input: CreateCreditCardChargeInput & { importFingerprint: string },
  database?: AppDb
) {
  const db = await resolveDb(database);
  const existing = await db.query.creditCardCharges.findFirst({
    where: eq(creditCardCharges.importFingerprint, input.importFingerprint),
  });
  const charge = await createCreditCardCharge(input, db);

  return { charge, created: !existing };
}

export async function updateCreditCardCharge(
  input: UpdateCreditCardChargeInput,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const parsedInput = updateCreditCardChargeSchema.parse(input);
  const existing = await assertChargeCanMutate(parsedInput.id, db);
  const values = createCreditCardChargeSchema.parse({
    accountId: parsedInput.accountId ?? existing.accountId,
    categoryId: parsedInput.categoryId ?? existing.categoryId,
    description: parsedInput.description ?? existing.description,
    notes: parsedInput.notes === undefined ? existing.notes : parsedInput.notes,
    purchaseDate: parsedInput.purchaseDate ?? existing.purchaseDate,
    totalAmountCents: parsedInput.totalAmountCents ?? existing.totalAmountCents,
    installmentCount: parsedInput.installmentCount ?? existing.installmentCount,
    kind: parsedInput.kind ?? existing.kind,
    firstInvoiceMonth: parsedInput.firstInvoiceMonth,
    importFingerprint:
      parsedInput.importFingerprint === undefined
        ? existing.importFingerprint ?? undefined
        : parsedInput.importFingerprint,
  });
  values.purchaseDate = normalizeDate(values.purchaseDate);

  const duplicate = values.importFingerprint
    ? await db.query.creditCardCharges.findFirst({
        where: eq(creditCardCharges.importFingerprint, values.importFingerprint),
      })
    : null;
  invariant(
    !duplicate || duplicate.id === parsedInput.id,
    "CREDIT_CARD_CHARGE_DUPLICATE_IMPORT",
    "Another credit card purchase already uses this import fingerprint."
  );

  const { account, category } = await validateCreditCardChargeDependencies(values, db);
  const firstInvoiceMonth = parsedInput.firstInvoiceMonth
    ? normalizeCompetenceMonth(parsedInput.firstInvoiceMonth)
    : parsedInput.purchaseDate || parsedInput.accountId
      ? resolveFirstInvoiceMonth(values.purchaseDate, account.creditClosingDay as number)
      : existing.firstInvoiceMonth;
  const installmentAmounts = splitInstallmentAmounts(
    values.totalAmountCents,
    values.installmentCount
  );

  return db.transaction(async (tx) => {
    const [updatedCharge] = await tx
      .update(creditCardCharges)
      .set({
        ...values,
        importFingerprint: values.importFingerprint ?? null,
        firstInvoiceMonth,
        updatedAt: currentTimestamp(),
      })
      .where(eq(creditCardCharges.id, parsedInput.id))
      .returning();
    invariant(updatedCharge, "CREDIT_CARD_CHARGE_UPDATE_FAILED", "Credit card purchase could not be updated.", 500);

    await tx
      .delete(creditCardInstallments)
      .where(eq(creditCardInstallments.chargeId, parsedInput.id));
    const installments = await tx
      .insert(creditCardInstallments)
      .values(
        installmentAmounts.map((amountCents, index) => ({
          chargeId: parsedInput.id,
          installmentNumber: index + 1,
          amountCents,
          invoiceMonth: shiftMonth(firstInvoiceMonth, index),
          updatedAt: currentTimestamp(),
        }))
      )
      .returning();

    return serializeCreditCardCharge(updatedCharge, account, category, installments);
  });
}

export async function deleteCreditCardCharge(id: string, database?: AppDb) {
  const db = await resolveDb(database);
  await assertChargeCanMutate(id, db);

  await db.transaction(async (tx) => {
    await tx.delete(creditCardInstallments).where(eq(creditCardInstallments.chargeId, id));
    const deleted = await tx
      .delete(creditCardCharges)
      .where(eq(creditCardCharges.id, id))
      .returning({ id: creditCardCharges.id });
    invariant(deleted.length > 0, "CREDIT_CARD_CHARGE_DELETE_FAILED", "Credit card purchase could not be deleted.", 500);
  });
}
