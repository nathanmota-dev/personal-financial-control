/* eslint-disable @typescript-eslint/no-explicit-any -- Preserve the generic Drizzle content adapter API. */
import { compareRows,indexedPredicate,matches,parsePredicate } from "@/lib/db/content-query";
import type { CreateContentQueryProcessorsContext } from "@/lib/interfaces/stages/create-content-query-processors";
import { getOperators,getOrderByOperators,getTableColumns,getTableName } from "drizzle-orm";

export function createContentQueryProcessors({ tables, tableConfigs, stripContentIndexes }: CreateContentQueryProcessorsContext) {
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
return { loadOptions, processRows };
}
