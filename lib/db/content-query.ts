import { Column, Param, SQL, StringChunk, and, eq, getTableColumns, getTableName, inArray, or } from "drizzle-orm";
import { contentIndex } from "@/lib/crypto/content";
import inventory from "@/lib/db/encryption-inventory.json";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

type Token = string | Column | { value: unknown };
type Operand = Column | { value: unknown };
export type Predicate = { kind: "and" | "or"; left: Predicate; right: Predicate } | { kind: "comparison"; left: Operand; operator: string; right?: Operand | Operand[] };

export function queryTokens(expression: SQL): Token[] {
  const result: Token[] = [];
  function flatten(chunk: unknown) {
    if (chunk instanceof SQL) chunk.queryChunks.forEach(flatten);
    else if (chunk instanceof StringChunk) {
      const text = chunk.value.join("");
      const tokens = text.match(/>=|<=|<>|!=|[=><(),]|\b(?:and|or|is|not|null|in|asc|desc|true|false)\b|\b\d+\b/gi) ?? [];
      if (text.replace(/>=|<=|<>|!=|[=><(),]|\b(?:and|or|is|not|null|in|asc|desc|true|false)\b|\b\d+\b|\s/gi, "")) throw new Error("Unsupported SQL in encrypted-content query.");
      result.push(...tokens.map((token) => token.toLowerCase()));
    } else if (chunk instanceof Column) result.push(chunk);
    else if (chunk instanceof Param) result.push({ value: chunk.value });
    else if (Array.isArray(chunk)) { result.push("("); chunk.forEach((item, index) => { if (index) result.push(","); flatten(item); }); result.push(")"); }
    else if (typeof chunk === "number" || typeof chunk === "boolean" || typeof chunk === "string" || chunk === null) result.push({ value: chunk });
    else throw new Error("Unsupported SQL operand in encrypted-content query.");
  }
  flatten(expression);
  return result;
}
export function parsePredicate(expression?: SQL): Predicate | undefined {
  if (!expression) return;
  const tokens = queryTokens(expression);
  if (tokens.length === 1 && (tokens[0] === "false" || tokens[0] === "true")) return { kind: "comparison", left: { value: 1 }, operator: "=", right: { value: tokens[0] === "true" ? 1 : 0 } };
  let cursor = 0;
  function operand(): Operand {
    const token = tokens[cursor++];
    if (token instanceof Column || typeof token === "object") return token;
    if (token && /^\d+$/.test(token)) return { value: Number(token) };
    throw new Error("Invalid encrypted-content query operand.");
  }
  function atom(): Predicate {
    if (tokens[cursor] === "(") { cursor++; const node = union(); if (tokens[cursor++] !== ")") throw new Error("Invalid query grouping."); return node; }
    const left = operand();
    let operator = tokens[cursor++] as string;
    if (operator === "is") { if (tokens[cursor] === "not") { cursor++; operator = "is not"; } if (tokens[cursor++] !== "null") throw new Error("Unsupported IS query."); return { kind: "comparison", left, operator }; }
    if (operator === "in") {
      if (tokens[cursor++] !== "(") throw new Error("Invalid IN query.");
      const right: Operand[] = [];
      do { right.push(operand()); } while (tokens[cursor++] === ",");
      if (tokens[cursor - 1] !== ")") throw new Error("Invalid IN query.");
      return { kind: "comparison", left, operator, right };
    }
    if (!["=", "!=", "<>", ">", "<", ">=", "<="].includes(operator)) throw new Error("Unsupported encrypted-content comparison.");
    return { kind: "comparison", left, operator, right: operand() };
  }
  function intersection(): Predicate { let node = atom(); while (tokens[cursor] === "and") { cursor++; node = { kind: "and", left: node, right: atom() }; } return node; }
  function union(): Predicate { let node = intersection(); while (tokens[cursor] === "or") { cursor++; node = { kind: "or", left: node, right: intersection() }; } return node; }
  const node = union();
  if (cursor !== tokens.length) throw new Error("Unsupported encrypted-content query suffix.");
  return node;
}
function property(column: Column) { return Object.entries(getTableColumns(column.table)).find(([, value]) => value.name === column.name)?.[0] ?? column.name; }
function value(operand: Operand, row: Record<string, unknown>) {
  const result = operand instanceof Column ? row[property(operand)] : operand.value;
  return result instanceof Date ? result.getTime() : result;
}
export function matches(node: Predicate | undefined, row: Record<string, unknown>): boolean {
  if (!node) return true;
  if (node.kind === "and") return matches(node.left, row) && matches(node.right, row);
  if (node.kind === "or") return matches(node.left, row) || matches(node.right, row);
  if (node.kind !== "comparison") throw new Error("Invalid predicate.");
  const left = value(node.left, row);
  if (node.operator === "is") return left == null;
  if (node.operator === "is not") return left != null;
  if (left == null) return false;
  if (Array.isArray(node.right)) return node.right.some((item) => value(item, row) === left);
  const right = value(node.right!, row);
  if (right == null) return false;
  switch (node.operator) {
    case "=": return left === right;
    case "!=": case "<>": return left !== right;
    case ">": return (left as string | number) > (right as string | number);
    case "<": return (left as string | number) < (right as string | number);
    case ">=": return (left as string | number) >= (right as string | number);
    case "<=": return (left as string | number) <= (right as string | number);
    default: throw new Error("Unsupported comparison.");
  }
}
// Only safe necessary conditions are sent to the persistent database.
export function indexedPredicate(node: Predicate | undefined, table: SQLiteTable): SQL | undefined {
  if (!node) return;
  if (node.kind === "and") return and(indexedPredicate(node.left, table), indexedPredicate(node.right, table));
  if (node.kind === "or") { const left = indexedPredicate(node.left, table); const right = indexedPredicate(node.right, table); return left && right ? or(left, right) : undefined; }
  if (node.kind !== "comparison" || !(node.left instanceof Column) || !["=", "in"].includes(node.operator)) return;
  const name = getTableName(table);
  const columns = getTableColumns(table);
  const classified = inventory[name as keyof typeof inventory] as Record<string, string>;
  const column = node.left;
  const technical = classified[column.name] === "technical";
  const target = technical ? column : Object.values(columns).find((item) => item.name === `${column.name}_hash`);
  if (!target) return;
  const operands = Array.isArray(node.right) ? node.right : [node.right!];
  if (operands.some((item) => item instanceof Column)) return;
  const values = operands.map((item) => (item as { value: unknown }).value).filter((item) => item != null).map((item) => technical ? item : contentIndex([item], `${name}.${column.name}`));
  return node.operator === "in" ? inArray(target, values) : values.length ? eq(target, values[0]) : undefined;
}
export function compareRows(order: SQL[], left: Record<string, unknown>, right: Record<string, unknown>) {
  for (const expression of order) {
    const tokens = queryTokens(expression);
    if (!(tokens[0] instanceof Column) || tokens.length !== 2 || !["asc", "desc"].includes(tokens[1] as string)) throw new Error("Unsupported encrypted-content ordering.");
    const a = value(tokens[0], left); const b = value(tokens[0], right);
    const delta = a == null ? b == null ? 0 : -1 : b == null ? 1 : typeof a === "string" && typeof b === "string" ? Buffer.compare(Buffer.from(a), Buffer.from(b)) : a < b ? -1 : a > b ? 1 : 0;
    if (delta) return tokens[1] === "desc" ? -delta : delta;
  }
  return 0;
}
