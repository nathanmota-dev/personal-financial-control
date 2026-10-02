/* eslint-disable @typescript-eslint/no-explicit-any -- Adapter preserves Drizzle's public generic API; runtime dispatch uses its table metadata. */
import { eq, getOperators, getOrderByOperators, getTableColumns, getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { withContentIndexes } from "@/lib/db/content-indexes";
import { compareRows, indexedPredicate, matches, parsePredicate } from "@/lib/db/content-query";

export function stripContentIndexes(value: any): any {
  if (Array.isArray(value)) return value.map(stripContentIndexes);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.endsWith("Hash")).map(([key, item]) => [key, stripContentIndexes(item)]));
}
export function protectContentPersistence<T extends object>(database: T, insideTransaction = false): T {
  const raw = database as any;
  const tableConfigs = raw._.schema;
  const tables = raw._.fullSchema;
  let verified = false;
  async function ready() {
    if (verified || insideTransaction) return;
    const result = await raw.$client.execute("SELECT version FROM __pfc_content_migration WHERE id = 1");
    if (result.rows[0]?.version !== 2) throw new Error("Content encryption migration is incomplete. Run npm run db:migrate before starting the app.");
    verified = true;
  }
  function resolveOptions(name: string, options: any = {}) {
    const table = tables[name];
    return {
      ...options,
      where: typeof options.where === "function" ? options.where(getTableColumns(table), getOperators()) : options.where,
      orderBy: typeof options.orderBy === "function" ? options.orderBy(getTableColumns(table), getOrderByOperators()) : options.orderBy,
    };
  }
  function loadOptions(name: string, options: any): any {
    const resolved = resolveOptions(name, options);
    const output: any = { where: indexedPredicate(parsePredicate(resolved.where), tables[name]) };
    if (options.with) output.with = Object.fromEntries(Object.entries(options.with).filter(([, value]) => value).map(([key, config]) => {
      const relation = tableConfigs[name].relations[key];
      const target = Object.keys(tableConfigs).find((item) => tableConfigs[item].dbName === getTableName(relation.referencedTable));
      return [key, loadOptions(target!, config === true ? {} : config)];
    }));
    return output;
  }
  function processRows(name: string, rows: any[], options: any = {}) {
    const resolved = resolveOptions(name, options);
    const predicate = parsePredicate(resolved.where);
    let output = rows.filter((row) => matches(predicate, row));
    if (resolved.orderBy) output.sort((a, b) => compareRows(Array.isArray(resolved.orderBy) ? resolved.orderBy : [resolved.orderBy], a, b));
    if (resolved.offset) output = output.slice(resolved.offset);
    if (resolved.limit !== undefined) output = output.slice(0, resolved.limit);
    return output.map((row) => {
      const result = { ...row };
      for (const [key, config] of Object.entries(options.with ?? {})) {
        if (!config) continue;
        const relation = tableConfigs[name].relations[key];
        const target = Object.keys(tableConfigs).find((item) => tableConfigs[item].dbName === getTableName(relation.referencedTable));
        const children = processRows(target!, Array.isArray(row[key]) ? row[key] : row[key] ? [row[key]] : [], config === true ? {} : config);
        result[key] = Array.isArray(row[key]) ? children : children[0] ?? null;
      }
      if (options.columns) {
        const includes = Object.values(options.columns).some(Boolean);
        for (const key of Object.keys(getTableColumns(tables[name]))) {
          if (includes ? !options.columns[key] : options.columns[key] === false) delete result[key];
        }
      }
      return stripContentIndexes(result);
    });
  }
  const query = new Proxy(raw.query, { get(target, name: string) {
    if (!(name in target)) return target[name];
    return {
      async findMany(options: any = {}) { await ready(); const rows = await target[name].findMany(loadOptions(name, options)); return processRows(name, rows, options); },
      async findFirst(options: any = {}) { await ready(); const rows = await target[name].findMany(loadOptions(name, options)); return processRows(name, rows, { ...options, limit: 1 })[0]; },
    };
  } });
  function mutation(operation: "insert" | "update" | "delete", table: SQLiteTable) {
    let values: any; let where: any; let returning: any; let conflict: any; let executed: Promise<any> | undefined;
    const chain: any = {
      values(input: any) { values = input; return chain; },
      set(input: any) { values = input; return chain; },
      where(input: any) { where = input; return chain; },
      returning(input?: any) { returning = input ?? true; return chain; },
      onConflictDoNothing(input?: any) { conflict = { kind: "nothing", ...input }; return chain; },
      onConflictDoUpdate(input: any) { conflict = { kind: "update", ...input }; return chain; },
      then(resolve: any, reject: any) { executed ??= execute(); return executed.then(resolve, reject); },
    };
    function targetColumn(column: any) { return Object.values(getTableColumns(table)).find((item) => item.name === `${column.name}_hash`) ?? column; }
    async function execute() {
      await ready();
      const name = Object.keys(tableConfigs).find((item) => tableConfigs[item].dbName === getTableName(table))!;
      const columns = getTableColumns(table);
      const run = async (db: any) => {
        if (operation === "insert") {
          const inputs = (Array.isArray(values) ? values : [values]).map((row) => withContentIndexes(table, row, true));
          let statement = db.insert(table).values(inputs);
          if (conflict) {
            const target = conflict.target ? (Array.isArray(conflict.target) ? conflict.target.map(targetColumn) : targetColumn(conflict.target)) : undefined;
            if (conflict.kind === "nothing") statement = statement.onConflictDoNothing({ target });
            else {
              // A single conflict update must never derive indexes from an unrelated inserted row.
              if (inputs.length !== 1) throw new Error("Encrypted upserts require a single row.");
              const row = withContentIndexes(table, { ...inputs[0], ...conflict.set });
              const set = { ...conflict.set };
              for (const [key, column] of Object.entries(columns)) if (column.name.endsWith("_hash")) {
                const source = column.name.slice(0, -5);
                const sourceKey = Object.entries(columns).find(([, item]) => item.name === source)?.[0];
                if ((sourceKey && sourceKey in conflict.set) || ((key === "activeQuoteSymbolHash" || key === "activeEmergencyHash") && ["isArchived", "quoteSymbol", "kind"].some((item) => item in conflict.set))) set[key] = row[key];
              }
              statement = statement.onConflictDoUpdate({ ...conflict, target, set });
            }
          }
          if (returning) statement = returning === true ? statement.returning() : statement.returning(returning);
          return stripContentIndexes(await statement);
        }
        const predicate = parsePredicate(where);
        const rows = (await db.query[name].findMany({ where: indexedPredicate(predicate, table) })).filter((row: any) => matches(predicate, row));
        const result = [];
        for (const row of rows) {
          let statement = operation === "delete" ? db.delete(table) : db.update(table).set(withContentIndexes(table, { ...row, ...values }));
          statement = statement.where(eq(columns.id, row.id));
          if (returning) statement = returning === true ? statement.returning() : statement.returning(returning);
          const changed = await statement;
          if (returning) result.push(...changed);
        }
        return stripContentIndexes(result);
      };
      return insideTransaction ? run(raw) : raw.transaction(run);
    }
    return chain;
  }
  return new Proxy(database, { get(target, property) {
    if (property === "query") return query;
    if (["select", "selectDistinct", "run", "all", "get", "values"].includes(property as string)) return () => { throw new Error("Use relational queries for encrypted content; arbitrary SQL bypasses content filtering."); };
    if (["insert", "update", "delete"].includes(property as string)) return (table: SQLiteTable) => mutation(property as "insert" | "update" | "delete", table);
    if (property === "transaction") return async (callback: any, config: any) => { await ready(); return raw.transaction((transaction: any) => callback(protectContentPersistence(transaction, true)), config); };
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  } });
}
