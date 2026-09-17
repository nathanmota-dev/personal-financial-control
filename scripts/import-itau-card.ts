import { getDatabase } from "@/lib/db";
import { createCategory, listCategories } from "@/lib/server/categories";

const baseUrl = process.env.PFC_BASE_URL ?? "http://127.0.0.1:3000";
const cardName = "Cartão Itaú Platinum final 9544";
const paymentAccountName = "Conta principal";

const categoryDefinitions = [
  "Educação & Cursos",
  "Vestuário & Moda",
  "Eletrônicos & Informática",
  "Streaming & Assinaturas",
  "Compras Online",
  "Software & IA",
  "Educação & Certificações",
  "Tarifas & Impostos",
  "Saúde & Farmácia",
  "Serviços em Nuvem & Armazenamento",
] as const;

const charges = [
  {
    description: "HUBLA *AGALEG",
    purchaseDate: "2026-05-06",
    totalAmountCents: 38310,
    installmentCount: 5,
    category: "Educação & Cursos",
    fingerprint: "itau:charge:hubla-agaleg:2026-05-06:5",
  },
  {
    description: "MP *BERMUDARIA",
    purchaseDate: "2026-06-01",
    totalAmountCents: 31983,
    installmentCount: 3,
    category: "Vestuário & Moda",
    fingerprint: "itau:charge:mp-bermudaria:2026-06-01:3",
  },
  {
    description: "MP *COMPSUPPLY",
    purchaseDate: "2026-06-11",
    totalAmountCents: 30880,
    installmentCount: 4,
    category: "Eletrônicos & Informática",
    fingerprint: "itau:charge:mp-compsupply:2026-06-11:4",
  },
  {
    description: "EBN *SPOTIFYCUR",
    purchaseDate: "2026-07-21",
    totalAmountCents: 1290,
    installmentCount: 1,
    category: "Streaming & Assinaturas",
    fingerprint: "itau:charge:spotify:2026-07-21:1290",
  },
  {
    description: "MERCADOLIVRE*MERCADOLIO",
    purchaseDate: "2026-07-22",
    totalAmountCents: 11100,
    installmentCount: 1,
    category: "Compras Online",
    fingerprint: "itau:charge:mercadolivre:2026-07-22:11100",
  },
  {
    description: "OPENAI *CHATGPT SUBSCRS",
    purchaseDate: "2026-07-02",
    totalAmountCents: 10593,
    installmentCount: 1,
    firstInvoiceMonth: "2026-08",
    category: "Software & IA",
    fingerprint: "itau:charge:openai:2026-07-02:10593",
  },
  {
    description: "WL *VUE*TESTING EXAM BLO",
    purchaseDate: "2026-07-09",
    totalAmountCents: 27200,
    installmentCount: 1,
    category: "Educação & Certificações",
    fingerprint: "itau:charge:wl-vue-exam:2026-07-09:27200",
  },
  {
    description: "WL *VUE*TESTING EXAM BLO (Estorno)",
    purchaseDate: "2026-07-16",
    totalAmountCents: -26950,
    installmentCount: 1,
    kind: "adjustment" as const,
    category: "Educação & Certificações",
    fingerprint: "itau:charge:wl-vue-exam-refund:2026-07-16:-26950",
  },
  {
    description: "IOF Transações Internacionais",
    purchaseDate: "2026-08-03",
    totalAmountCents: 1323,
    installmentCount: 1,
    category: "Tarifas & Impostos",
    fingerprint: "itau:charge:iof:2026-08-03:1323",
  },
  {
    description: "DROGARIA SAO PAULOJABOT",
    purchaseDate: "2026-08-13",
    totalAmountCents: 5499,
    installmentCount: 1,
    category: "Saúde & Farmácia",
    fingerprint: "itau:charge:drogaria:2026-08-13:5499",
  },
  {
    description: "MERCADOLIVRE*MERCADOLIO",
    purchaseDate: "2026-08-19",
    totalAmountCents: 13526,
    installmentCount: 1,
    category: "Compras Online",
    fingerprint: "itau:charge:mercadolivre:2026-08-19:13526",
  },
  {
    description: "Shein *SHEINCOMSa",
    purchaseDate: "2026-08-20",
    totalAmountCents: 14136,
    installmentCount: 1,
    category: "Vestuário & Moda",
    fingerprint: "itau:charge:shein:2026-08-20:14136",
  },
  {
    description: "Google OneSAO PAULOBRA",
    purchaseDate: "2026-08-24",
    totalAmountCents: 3599,
    installmentCount: 1,
    category: "Serviços em Nuvem & Armazenamento",
    fingerprint: "itau:charge:google-one:2026-08-24:3599",
  },
  {
    description: "EBN*SPOTIFYCURITIBABRA",
    purchaseDate: "2026-08-21",
    totalAmountCents: 1290,
    installmentCount: 1,
    category: "Streaming & Assinaturas",
    fingerprint: "itau:charge:spotify:2026-08-21:1290",
  },
  {
    description: "OPENAI *CHATGPT SUBSCRS",
    purchaseDate: "2026-08-02",
    totalAmountCents: 10574,
    installmentCount: 1,
    firstInvoiceMonth: "2026-09",
    category: "Software & IA",
    fingerprint: "itau:charge:openai:2026-08-02:10574",
  },
  {
    description: "IOF Transações Internacionais",
    purchaseDate: "2026-09-03",
    totalAmountCents: 370,
    installmentCount: 1,
    category: "Tarifas & Impostos",
    fingerprint: "itau:charge:iof:2026-09-03:370",
  },
] as const;

const expectedEntries: Record<string, Array<[string, number]>> = {
  "2026-08": [
    ["HUBLA *AGALEG", 7662],
    ["MP *BERMUDARIA", 10661],
    ["MP *COMPSUPPLY", 7720],
    ["EBN *SPOTIFYCUR", 1290],
    ["MERCADOLIVRE*MERCADOLIO", 11100],
    ["OPENAI *CHATGPT SUBSCRS", 10593],
    ["WL *VUE*TESTING EXAM BLO", 27200],
    ["WL *VUE*TESTING EXAM BLO (Estorno)", -26950],
    ["IOF Transações Internacionais", 1323],
  ],
  "2026-09": [
    ["HUBLA *AGALEG", 7662],
    ["MP *COMPSUPPLY", 7720],
    ["DROGARIA SAO PAULOJABOT", 5499],
    ["MERCADOLIVRE*MERCADOLIO", 13526],
    ["Shein *SHEINCOMSa", 14136],
    ["Google OneSAO PAULOBRA", 3599],
    ["EBN*SPOTIFYCURITIBABRA", 1290],
    ["OPENAI *CHATGPT SUBSCRS", 10574],
    ["IOF Transações Internacionais", 370],
  ],
};

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json()) as T & { ok?: boolean; error?: unknown };
  if (!response.ok || body.ok === false) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${JSON.stringify(body)}`);
  }

  return body;
}

async function postJson<T>(path: string, payload: unknown) {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function ensureCategories() {
  const db = getDatabase();
  const existing = await listCategories({ includeArchived: true }, db);
  const categoryIds = new Map<string, string>();

  for (const name of categoryDefinitions) {
    const current = existing.find((category) => category.name === name);
    if (current) {
      if (current.isArchived || current.group !== "variable_expense") {
        throw new Error(`Category ${name} exists with an incompatible state/group.`);
      }
      categoryIds.set(name, current.id);
      continue;
    }

    const created = await createCategory({ name, group: "variable_expense" }, db);
    categoryIds.set(name, created.id);
  }

  return categoryIds;
}

async function verifyInvoice(accountId: string, invoiceMonth: string) {
  const result = await requestJson<{
    charges: Array<{ description: string; installments: Array<{ amountCents: number }> }>;
  }>(`/api/credit-card/charges?accountId=${accountId}&invoiceMonth=${invoiceMonth}`);
  const actual = result.charges.flatMap((charge) =>
    charge.installments.map((installment) => [charge.description, installment.amountCents] as [string, number])
  );
  const expected = expectedEntries[invoiceMonth] ?? [];
  const sortEntries = (entries: Array<[string, number]>) =>
    [...entries].sort(([leftDescription, leftAmount], [rightDescription, rightAmount]) =>
      leftDescription.localeCompare(rightDescription) || leftAmount - rightAmount
    );

  if (JSON.stringify(sortEntries(actual)) !== JSON.stringify(sortEntries(expected))) {
    throw new Error(
      `Invoice ${invoiceMonth} did not match the PDF. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`
    );
  }
}

async function main() {
  const accountsResponse = await requestJson<{
    accounts: Array<{ id: string; name: string; type: string; isArchived: boolean }>;
  }>("/api/accounts");
  const card = accountsResponse.accounts.find(
    (account) => account.name === cardName && account.type === "credit" && !account.isArchived
  );
  const paymentAccount = accountsResponse.accounts.find(
    (account) => account.name === paymentAccountName && account.type === "checking" && !account.isArchived
  );
  if (!card || !paymentAccount) {
    throw new Error("The configured Itaú credit card or payment account could not be resolved.");
  }

  const categoryIds = await ensureCategories();
  for (const charge of charges) {
    await postJson(`/api/credit-card/charges`, {
      accountId: card.id,
      categoryId: categoryIds.get(charge.category),
      description: charge.description,
      purchaseDate: charge.purchaseDate,
      totalAmountCents: charge.totalAmountCents,
      installmentCount: charge.installmentCount,
      firstInvoiceMonth: "firstInvoiceMonth" in charge ? charge.firstInvoiceMonth : undefined,
      kind: "kind" in charge ? charge.kind : "purchase",
      importFingerprint: charge.fingerprint,
      notes: "Importado das faturas Itaú de agosto e setembro de 2026.",
    });
  }

  await verifyInvoice(card.id, "2026-08");
  await verifyInvoice(card.id, "2026-09");

  await postJson("/api/credit-card/bills", {
    accountId: card.id,
    invoiceMonth: "2026-08",
    dueDate: "2026-08-10",
    statementTotalCents: 39592,
    currentChargesTotalCents: 50599,
    priorBalanceCents: 16071,
    preStatementPaymentsCents: 11007,
    ignoredAmountCents: 0,
  });
  await postJson("/api/credit-card/bills", {
    accountId: card.id,
    invoiceMonth: "2026-09",
    dueDate: "2026-09-10",
    statementTotalCents: 64618,
    currentChargesTotalCents: 64618,
    priorBalanceCents: 39592,
    preStatementPaymentsCents: 0,
    ignoredAmountCents: 242,
  });

  const payments = [
    {
      invoiceMonth: "2026-07",
      amountCents: 16071,
      paymentDate: "2026-07-06",
      kind: "unlinked",
      idempotencyKey: "itau:payment:previous-invoice:2026-07-06:16071",
    },
    {
      invoiceMonth: "2026-08",
      amountCents: 11007,
      paymentDate: "2026-07-06",
      kind: "pre_statement",
      idempotencyKey: "itau:payment:2026-08:pre-statement:2026-07-06:11007",
    },
    {
      invoiceMonth: "2026-08",
      amountCents: 39592,
      paymentDate: "2026-08-04",
      kind: "settlement",
      idempotencyKey: "itau:payment:2026-08:settlement:2026-08-04:39592",
    },
    {
      invoiceMonth: "2026-09",
      amountCents: 64618,
      paymentDate: "2026-09-10",
      kind: "settlement",
      idempotencyKey: "itau:payment:2026-09:settlement:2026-09-10:64618",
    },
  ] as const;

  for (const payment of payments) {
    await postJson(`/api/credit-card/bills/${payment.invoiceMonth}/payments`, {
      accountId: card.id,
      paymentAccountId: paymentAccount.id,
      amountCents: payment.amountCents,
      paymentDate: payment.paymentDate,
      kind: payment.kind,
      idempotencyKey: payment.idempotencyKey,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        cardAccountId: card.id,
        paymentAccountId: paymentAccount.id,
        chargesPosted: charges.length,
        billsPosted: 2,
        paymentsPosted: payments.length,
        ignored: ["Google One 20/08 R$ 24,99", "CANCELAMENTO PARCIAL DE 25/08 -R$ 22,57"],
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
