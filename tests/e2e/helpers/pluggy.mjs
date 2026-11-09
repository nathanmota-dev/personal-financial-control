// Runs in the production server process, so tests never reach the real Pluggy API.
const previousFetch = globalThis.fetch;
const json = (body) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const CARD_ITEM_ID = "99999999-2222-3333-4444-555555555555";

/** Due today and closed a week ago, so the checking payment stubbed below always settles it. */
function cardBill() {
  const now = Date.now();
  const utcMidnight = (time) => `${new Date(time).toISOString().slice(0, 10)}T00:00:00.000Z`;
  return { id: "e2e-bill", dueDate: utcMidnight(now), billClosingDate: utcMidnight(now - 7 * 86_400_000), totalAmount: 300, payments: [] };
}

/** Every installment is delivered at once: the first posted on a bill, and the future ones still pending. */
function cardTransactions() {
  const date = new Date().toISOString();
  const purchaseDate = `${date.slice(0, 10)}T00:00:00.000Z`;
  const part = (number, overrides) => ({ id: `e2e-card-${number}`, date, amount: 30, type: "DEBIT", status: "PENDING", description: `COMPRA CARTAO E2E ${number}/3`, creditCardMetadata: { installmentNumber: number, totalInstallments: 3, purchaseDate }, ...overrides });
  return [part(1, { status: "POSTED", creditCardMetadata: { installmentNumber: 1, totalInstallments: 3, purchaseDate, billId: "e2e-bill" } }), part(2), part(3)];
}

globalThis.fetch = async function (input, init) {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== "api.pluggy.ai") return previousFetch(input, init);
  if (url.pathname === "/auth") return json({ apiKey: "e2e-api-key" });
  if (url.pathname === "/accounts") {
    if (url.searchParams.get("itemId") === CARD_ITEM_ID) return json({ results: [{ id: "remote-card", type: "CREDIT", name: "Cartão remoto", number: "0099" }], totalPages: 1 });
    return json({ results: [{ id: "remote-checking", type: "BANK", name: "Conta remota", number: "0012345" }], totalPages: 1 });
  }
  if (url.pathname === "/bills") return json({ results: [cardBill()], totalPages: 1 });
  if (url.pathname === "/v2/transactions") {
    if (url.searchParams.get("accountId") === "remote-card") return json({ results: cardTransactions() });
    const date = new Date().toISOString();
    const owner = { documentNumber: "12345678909" };
    return json({ results: [
      { id: "e2e-expense", date, amount: -45.9, type: "DEBIT", status: "POSTED", description: "Mercado E2E", operationType: "PIX", paymentData: { payer: owner, receiver: { documentNumber: "98765432100" } } },
      { id: "e2e-expense-2", date, amount: -54.1, type: "DEBIT", status: "POSTED", description: "MERCADO E2E PARC 02/03", operationType: "PIX", paymentData: { payer: owner, receiver: { documentNumber: "98765432100" } } },
      { id: "e2e-income", date, amount: 1000, type: "CREDIT", status: "POSTED", description: "Salário E2E", operationType: "OUTROS" },
      { id: "e2e-card", date, amount: -300, type: "DEBIT", status: "POSTED", description: "PAGAMENTO FATURA E2E", operationType: "OUTROS" },
    ] });
  }
  if (url.pathname.startsWith("/items/")) return json({ id: url.pathname.split("/").pop(), status: "UPDATED", connector: { name: "MeuPluggy" }, lastUpdatedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: "2026-07-17T10:00:00.000Z" });
  return new Response("{}", { status: 404 });
};
