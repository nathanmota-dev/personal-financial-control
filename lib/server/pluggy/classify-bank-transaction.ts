import type { PluggyBankClassification, PluggyBankRow, PluggyOwnIdentity } from "@/lib/interfaces/pluggy-bank-import";

type ClassifierRow = Pick<PluggyBankRow, "direction" | "description" | "operationType" | "paymentData">;
type Party = NonNullable<NonNullable<PluggyBankRow["paymentData"]>["payer"]>;
type PartyMatch = "owner" | "other" | "unknown";

const CARD_PAYMENT = /\bPAGAMENTO\b.*\bFATURA\b/;
const CONTRIBUTION = /\bAPLICACAO\b/;
const WITHDRAWAL = /\b(RESGATE|APLICACAO)\b/;

/** Uppercase, without accents or punctuation, and with single spaces. */
export function normalizeOwnerName(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function partyDocument(party: Party) {
  const value = typeof party.documentNumber === "string" ? party.documentNumber : party.documentNumber?.value;
  return value?.replace(/\D/g, "") || null;
}

/** A document decides on its own, so a homonym with another CPF is never the owner. */
function matchParty(party: Party | null | undefined, identity: PluggyOwnIdentity): PartyMatch {
  if (!party) return "unknown";
  const document = partyDocument(party);
  if (document && identity.cpf) return document === identity.cpf ? "owner" : "other";
  const name = party.name ? normalizeOwnerName(party.name) : "";
  if (!name) return "unknown";
  return identity.names.includes(name) ? "owner" : "other";
}

/** The name must not continue with more words, which would make it someone else's longer name. */
function descriptionNamesOwner(description: string, identity: PluggyOwnIdentity) {
  const tokens = normalizeOwnerName(description).split(" ");
  return identity.names.some((name) => {
    const parts = name.split(" ");
    return tokens.some((_, start) => {
      if (parts.some((part, offset) => tokens[start + offset] !== part)) return false;
      const next = tokens[start + parts.length];
      return next === undefined || /^\d+$/.test(next);
    });
  });
}

function counterparty(row: ClassifierRow) {
  return row.direction === "DEBIT" ? row.paymentData?.receiver : row.paymentData?.payer;
}

function ownSide(row: ClassifierRow) {
  return row.direction === "DEBIT" ? row.paymentData?.payer : row.paymentData?.receiver;
}

// Banks fill the owner's own side on nearly every row, so one matching side proves nothing: both must match.
function isOwnTransfer(row: ClassifierRow, identity: PluggyOwnIdentity) {
  const own = matchParty(ownSide(row), identity);
  const other = matchParty(counterparty(row), identity);
  if (own === "owner" && other === "owner") return true;
  return own === "unknown" && other === "unknown" && descriptionNamesOwner(row.description, identity);
}

function investmentMovement(row: ClassifierRow, description: string): PluggyBankClassification | null {
  const { direction, operationType } = row;
  // A reserved balance leaves the available balance like an application, and comes back like a redemption.
  if (operationType === "TRANSFERENCIA_SALDO_RESERVADO") return direction === "DEBIT" ? "investment_contribution" : "investment_withdrawal";
  if (operationType === "RESGATE_APLIC_FINANCEIRA" && direction === "CREDIT") return "investment_withdrawal";
  // Any other specific type, including PIX and yield, is not a movement even if its text mentions one.
  if (operationType && operationType !== "OUTROS") return null;
  if (direction === "DEBIT") return CONTRIBUTION.test(description) ? "investment_contribution" : null;
  return WITHDRAWAL.test(description) ? "investment_withdrawal" : null;
}

export function classifyBankTransaction(row: ClassifierRow, identity: PluggyOwnIdentity): PluggyBankClassification {
  if (isOwnTransfer(row, identity)) return "own_transfer";
  const description = normalizeOwnerName(row.description);
  if (row.direction === "DEBIT" && CARD_PAYMENT.test(description)) return "card_payment";
  return investmentMovement(row, description) ?? "ordinary";
}

/** Rows that cannot be proven own transfers but name the owner, so a person should review them. */
export function isPossibleOwnTransfer(row: ClassifierRow, identity: PluggyOwnIdentity) {
  const other = matchParty(counterparty(row), identity);
  return other === "owner" || (other === "unknown" && descriptionNamesOwner(row.description, identity));
}
