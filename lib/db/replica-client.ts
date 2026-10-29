import type { Client, InArgs, InStatement, Transaction, TransactionMode } from "@libsql/client";
import type { ReplicaClientHooks } from "@/lib/interfaces/database-replica";
import { databaseUnavailable, isConnectionFailure } from "./replica-errors";

function isRead(statement: InStatement) {
  const sql = typeof statement === "string" ? statement : statement.sql;
  return /^\s*select\b/i.test(sql);
}

export function serializeReplicaClient(raw: Client, hooks: ReplicaClientHooks) {
  let tail = Promise.resolve();
  async function acquire() {
    let release!: () => void;
    const previous = tail;
    tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    return release;
  }
  async function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const release = await acquire();
    try { return await operation(); } finally { release(); }
  }
  async function perform<T>(operation: () => Promise<T>, write: boolean) {
    if (write) await hooks.beforeWrite();
    return exclusive(async () => {
      if (write) hooks.assertWritable();
      return translateFailure(operation, write, hooks.failed);
    });
  }
  const client: Client = {
    get closed() { return raw.closed; },
    protocol: raw.protocol,
    execute: (statement: InStatement, args?: InArgs) => perform(() => typeof statement === "string" ? raw.execute(statement, args) : raw.execute(statement), !isRead(statement)),
    batch: (statements, mode) => perform(() => raw.batch(statements, mode), true),
    executeMultiple: (sql) => perform(() => raw.executeMultiple(sql), true),
    // Schema changes belong on the remote connection, never on this file.
    migrate: async () => { throw new Error("Run migrations on the remote database before syncing the replica."); },
    sync: () => exclusive(() => raw.sync()),
    reconnect: () => exclusive(async () => { raw.reconnect(); }),
    close: () => raw.close(),
    transaction: async (mode?: TransactionMode) => {
      await hooks.beforeWrite();
      const release = await acquire();
      try {
        hooks.assertWritable();
        const transaction = await translateFailure(() => raw.transaction(mode), false, hooks.failed);
        return serializedTransaction(transaction, release, hooks.failed);
      } catch (error) { release(); throw error; }
    },
  };
  return { client, exclusive };
}

async function translateFailure<T>(operation: () => Promise<T>, uncertain: boolean, failed: () => void) {
  try { return await operation(); }
  catch (error) {
    if (!isConnectionFailure(error)) throw error;
    failed();
    throw databaseUnavailable(uncertain);
  }
}

function serializedTransaction(raw: Transaction, release: () => void, failed: () => void): Transaction {
  let finished = false;
  async function end(commit: boolean) {
    if (finished) return;
    finished = true;
    try {
      await translateFailure(() => commit ? raw.commit() : raw.rollback(), commit, failed);
    } finally {
      try { raw.close(); } finally { release(); }
    }
  }
  return {
    get closed() { return finished || raw.closed; },
    execute: (statement) => translateFailure(() => raw.execute(statement), false, failed),
    batch: (statements) => translateFailure(() => raw.batch(statements), false, failed),
    executeMultiple: (sql) => translateFailure(() => raw.executeMultiple(sql), false, failed),
    commit: () => end(true),
    rollback: () => end(false),
    close: () => {
      if (finished) return;
      finished = true;
      try { raw.close(); } finally { release(); }
    },
  };
}
