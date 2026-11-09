import { describe, expect, it } from "vitest";

import { normalizeDescription } from "@/lib/server/pluggy/normalize-description";

describe("normalizeDescription", () => {
  it.each([
    ["uppercases text", "Mercado Bom", "MERCADO BOM"],
    ["removes accents", "Açaí da Praça", "ACAI DA PRACA"],
    ["collapses spaces", "  LOJA    CENTRAL \t X ", "LOJA CENTRAL X"],
    ["removes PARC suffix", "LOJA CENTRAL PARC 03/05", "LOJA CENTRAL"],
    ["removes PARCELA suffix", "LOJA CENTRAL PARCELA 3 DE 5", "LOJA CENTRAL"],
    ["removes PARC with a dot and no space", "LOJA CENTRAL PARC.03/05", "LOJA CENTRAL"],
    ["removes a bare installment", "LOJA CENTRAL 3/5", "LOJA CENTRAL"],
    ["removes a separated suffix", "LOJA CENTRAL - PARC 03/05", "LOJA CENTRAL"],
    ["removes a full date", "PIX LOJA 15/03/2026", "PIX LOJA"],
    ["removes a two-digit year date", "PIX LOJA 15-03-26", "PIX LOJA"],
    ["removes an ISO date", "PIX LOJA 2026-03-15", "PIX LOJA"],
    ["removes a day and month", "PIX LOJA 15/03", "PIX LOJA"],
    ["removes a named month", "COMPRA LOJA 15MAR", "COMPRA LOJA"],
    ["removes a long identifier", "PEDIDO 123456789 LOJA", "PEDIDO LOJA"],
    ["removes a formatted document", "PIX 12.345.678/0001-90 LOJA", "PIX LOJA"],
    ["removes a glued identifier", "PEDIDO123456 LOJA", "PEDIDO LOJA"],
    ["keeps short numbers that identify a merchant", "POSTO 24 HORAS LOJA 123", "POSTO 24 HORAS LOJA 123"],
    ["keeps merchants apart", "PADARIA SAO JOAO", "PADARIA SAO JOAO"],
    ["keeps text made only of removable parts", "03/05", "03/05"],
    ["keeps a lone identifier", "123456789", "123456789"],
  ])("%s", (_name, input, expected) => {
    expect(normalizeDescription(input)).toBe(expected);
  });

  it("gives every installment of a purchase the same text", () => {
    expect(new Set(["Loja Central PARC 01/03", "LOJA CENTRAL PARC 02/03", "loja central 3/3"].map(normalizeDescription))).toEqual(new Set(["LOJA CENTRAL"]));
  });
});
