import { describe, expect, it } from "vitest";

import type { PluggyBankRow, PluggyOwnIdentity } from "@/lib/interfaces/pluggy-bank-import";
import { classifyBankTransaction, isPossibleOwnTransfer, normalizeOwnerName } from "@/lib/server/pluggy/classify-bank-transaction";

const CPF = "12345678909";
const identity: PluggyOwnIdentity = { names: ["JOAO DA SILVA"], cpf: CPF };
const owner = { documentNumber: CPF, name: null };
const third = { documentNumber: "98765432100", name: "OUTRA PESSOA" };
type Row = Pick<PluggyBankRow, "direction" | "description" | "operationType" | "paymentData">;
const row = (overrides: Partial<Row> = {}): Row => ({ direction: "DEBIT", description: "Mercado", operationType: "OUTROS", paymentData: null, ...overrides });

describe("classifyBankTransaction", () => {
  it("normalizes accents, casing and spacing", () => {
    expect(normalizeOwnerName("  João   da-Silva ")).toBe("JOAO DA SILVA");
  });

  it("is ordinary by default and without an identity", () => {
    expect(classifyBankTransaction(row(), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: owner } }), { names: [], cpf: null })).toBe("ordinary");
  });

  it("requires the owner on both sides, since the own side is always filled", () => {
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: owner } }), identity)).toBe("own_transfer");
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: third } }), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ direction: "CREDIT", paymentData: { payer: third, receiver: owner } }), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: null } }), identity)).toBe("ordinary");
  });

  it("accepts a document object", () => {
    const document = { documentNumber: { type: "CPF", value: "123.456.789-09" } };
    expect(classifyBankTransaction(row({ paymentData: { payer: document, receiver: document } }), identity)).toBe("own_transfer");
  });

  it("gives the CPF priority over a matching name", () => {
    const homonym = { documentNumber: "98765432100", name: "João da Silva" };
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: homonym } }), identity)).toBe("ordinary");
  });

  it("matches by full name, ignoring accents and casing, when documents are missing", () => {
    const named = { name: "joão  DA silva" };
    expect(classifyBankTransaction(row({ paymentData: { payer: named, receiver: named } }), identity)).toBe("own_transfer");
    expect(classifyBankTransaction(row({ paymentData: { payer: owner, receiver: named } }), { ...identity, cpf: CPF })).toBe("own_transfer");
  });

  it.each(["João da Silva Santos", "João", "Silva"])("rejects the partial name %s", (name) => {
    const payer = { name: "João da Silva" };
    expect(classifyBankTransaction(row({ paymentData: { payer, receiver: { name } } }), identity)).toBe("ordinary");
  });

  it("falls back on the description only when paymentData has no parties", () => {
    expect(classifyBankTransaction(row({ description: "TED ENVIADA João da Silva 1203" }), identity)).toBe("own_transfer");
    expect(classifyBankTransaction(row({ description: "PIX JOAO DA SILVA", paymentData: { payer: {}, receiver: {} } }), identity)).toBe("own_transfer");
    expect(classifyBankTransaction(row({ description: "TED JOAO DA SILVA SANTOS" }), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ description: "PIX JOAO DA SILVA", paymentData: { payer: owner, receiver: third } }), identity)).toBe("ordinary");
  });

  it("recognizes a card bill payment only on debits", () => {
    expect(classifyBankTransaction(row({ description: "Pagamento efetuado FATURA FATURA 03" }), identity)).toBe("card_payment");
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "PAGAMENTO FATURA" }), identity)).toBe("ordinary");
  });

  it("recognizes investment movements by description", () => {
    expect(classifyBankTransaction(row({ description: "APLICAÇÃO CDB 123" }), identity)).toBe("investment_contribution");
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "RESGATE CDB 123" }), identity)).toBe("investment_withdrawal");
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "ESTORNO APLICACAO", operationType: null }), identity)).toBe("investment_withdrawal");
  });

  it("recognizes investment movements by operation type", () => {
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "Qualquer", operationType: "RESGATE_APLIC_FINANCEIRA" }), identity)).toBe("investment_withdrawal");
    expect(classifyBankTransaction(row({ description: "Reserva", operationType: "TRANSFERENCIA_SALDO_RESERVADO" }), identity)).toBe("investment_contribution");
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "Reserva", operationType: "TRANSFERENCIA_SALDO_RESERVADO" }), identity)).toBe("investment_withdrawal");
  });

  it("keeps yield and payment rails out of investment movements", () => {
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "REND PAGO APLIC", operationType: "RENDIMENTO_APLIC_FINANCEIRA" }), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ direction: "CREDIT", description: "RESGATE DE SEGURO", operationType: "PIX" }), identity)).toBe("ordinary");
    expect(classifyBankTransaction(row({ description: "Resgate estornado" }), identity)).toBe("ordinary");
  });

  it("applies the precedence own transfer, card payment, investment", () => {
    const paymentData = { payer: owner, receiver: owner };
    expect(classifyBankTransaction(row({ description: "PAGAMENTO FATURA", paymentData }), identity)).toBe("own_transfer");
    expect(classifyBankTransaction(row({ description: "PAGAMENTO FATURA APLICACAO" }), identity)).toBe("card_payment");
  });
});

describe("isPossibleOwnTransfer", () => {
  it("flags a counterparty that is the owner when the row cannot be proven", () => {
    expect(isPossibleOwnTransfer(row({ paymentData: { payer: null, receiver: owner } }), identity)).toBe(true);
    expect(isPossibleOwnTransfer(row({ description: "TED JOAO DA SILVA", paymentData: { payer: owner, receiver: null } }), identity)).toBe(true);
  });

  it("ignores third parties", () => {
    expect(isPossibleOwnTransfer(row({ paymentData: { payer: owner, receiver: third } }), identity)).toBe(false);
    expect(isPossibleOwnTransfer(row({ direction: "CREDIT", paymentData: { payer: third, receiver: owner } }), identity)).toBe(false);
  });
});
