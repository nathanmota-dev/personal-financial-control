// Runs in the production server process, so tests never reach the real Pluggy API.
const previousFetch = globalThis.fetch;
const json = (body) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
globalThis.fetch = async function (input, init) {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== "api.pluggy.ai") return previousFetch(input, init);
  if (url.pathname === "/auth") return json({ apiKey: "e2e-api-key" });
  if (url.pathname === "/accounts") return json({ results: [{ id: "remote-checking", type: "BANK", name: "Conta remota", number: "0012345" }], totalPages: 1 });
  if (url.pathname === "/v2/transactions") {
    const date = new Date().toISOString();
    const owner = { documentNumber: "12345678909" };
    return json({ results: [
      { id: "e2e-expense", date, amount: -45.9, type: "DEBIT", status: "POSTED", description: "Mercado E2E", operationType: "PIX", paymentData: { payer: owner, receiver: { documentNumber: "98765432100" } } },
      { id: "e2e-income", date, amount: 1000, type: "CREDIT", status: "POSTED", description: "Salário E2E", operationType: "OUTROS" },
      { id: "e2e-card", date, amount: -300, type: "DEBIT", status: "POSTED", description: "PAGAMENTO FATURA E2E", operationType: "OUTROS" },
    ] });
  }
  if (url.pathname.startsWith("/items/")) return json({ id: url.pathname.split("/").pop(), status: "UPDATED", connector: { name: "MeuPluggy" }, lastUpdatedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: "2026-07-17T10:00:00.000Z" });
  return new Response("{}", { status: 404 });
};
