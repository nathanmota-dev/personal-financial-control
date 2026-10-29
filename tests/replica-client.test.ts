import { describe, expect, it, vi } from "vitest";
import type { Client, Transaction } from "@libsql/client";
import { serializeReplicaClient } from "@/lib/db/replica-client";
import { databaseUnavailable, replicaError, isConnectionFailure } from "@/lib/db/replica-errors";
import { actionError } from "@/app/actions/finance/action-runtime";
import { databaseErrorResponse } from "@/lib/server/database-error-response";

function fixture() {
  const tx = { execute: vi.fn().mockResolvedValue({ rows: [] }), batch: vi.fn().mockResolvedValue([]), executeMultiple: vi.fn(), commit: vi.fn(), rollback: vi.fn(), close: vi.fn(), closed: false };
  const raw = { ...tx, execute: vi.fn().mockResolvedValue({ rows: [] }), transaction: vi.fn().mockResolvedValue(tx), sync: vi.fn().mockResolvedValue({ frames_synced: 0 }), reconnect: vi.fn(), protocol: "file" };
  const hooks = { beforeWrite: vi.fn().mockResolvedValue(undefined), assertWritable: vi.fn(), failed: vi.fn() };
  return { raw, tx, hooks, ...serializeReplicaClient(raw as unknown as Client, hooks) };
}

describe("replica operation serialization", () => {
  it("serves reads without testing network availability, gates writes and preserves arguments", async () => {
    const { client, raw, hooks } = fixture();
    await client.execute("SELECT 1", [1]);
    await client.execute({ sql: "select * from accounts", args: [] });
    expect(hooks.beforeWrite).not.toHaveBeenCalled();
    expect(raw.execute).toHaveBeenCalledWith("SELECT 1", [1]);
    await client.execute("INSERT INTO accounts VALUES (1)");
    expect(hooks.beforeWrite).toHaveBeenCalledTimes(1);
    expect(hooks.assertWritable).toHaveBeenCalledTimes(1);
  });
  it("holds the queue for the entire transaction and only then runs sync and reads", async () => {
    const { client, raw, tx } = fixture();
    const transaction = await client.transaction();
    const sync = client.sync();
    const read = client.execute("SELECT 1");
    await transaction.execute("INSERT INTO accounts VALUES (1)");
    await transaction.batch(["SELECT 1"]);
    await transaction.executeMultiple("SELECT 1;");
    expect(raw.sync).not.toHaveBeenCalled();
    expect(raw.execute).not.toHaveBeenCalled();
    await transaction.commit();
    await Promise.all([sync, read]);
    expect(tx.commit).toHaveBeenCalledTimes(1);
    expect(tx.close).toHaveBeenCalledTimes(1);
    expect(transaction.closed).toBe(true);
    expect(raw.sync).toHaveBeenCalledTimes(1);
    expect(raw.execute).toHaveBeenCalledTimes(1);
    await transaction.rollback();
    transaction.close();
    expect(tx.close).toHaveBeenCalledTimes(1);
  });
  it("releases failed starts and rollback/close paths without poisoning the queue", async () => {
    const { client, raw, tx } = fixture();
    raw.transaction.mockRejectedValueOnce(new Error("connection failed"));
    await expect(client.transaction()).rejects.toMatchObject({ code: "DATABASE_UNAVAILABLE" });
    const transaction = await client.transaction("write");
    await transaction.rollback();
    expect(tx.rollback).toHaveBeenCalledTimes(1);
    const next = await client.transaction();
    next.close();
    await client.execute("SELECT 1");
    expect(raw.execute).toHaveBeenCalledTimes(1);
  });
  it("reports an uncertain commit, closes the transaction and never retries it", async () => {
    const { client, tx, hooks } = fixture();
    tx.commit.mockRejectedValueOnce(new Error("socket closed"));
    const transaction = await client.transaction();
    await expect(transaction.commit()).rejects.toMatchObject({ code: "DATABASE_WRITE_UNCONFIRMED" });
    expect(hooks.failed).toHaveBeenCalledOnce();
    await client.execute("SELECT 1");
    expect(tx.commit).toHaveBeenCalledOnce();
  });
  it("does not label validation or SQL constraint failures as connectivity errors", async () => {
    const { client, raw, hooks } = fixture();
    const error = new Error("SQLITE_CONSTRAINT_UNIQUE");
    raw.execute.mockRejectedValueOnce(error);
    await expect(client.execute("INSERT INTO accounts VALUES (1)")).rejects.toBe(error);
    expect(hooks.failed).not.toHaveBeenCalled();
  });
  it("rejects writes before sending anything when unavailable and retains reads", async () => {
    const { client, raw, hooks } = fixture();
    hooks.beforeWrite.mockRejectedValue(databaseUnavailable());
    await expect(client.batch(["INSERT INTO accounts VALUES (1)"])).rejects.toMatchObject({ status: 503 });
    await expect(client.executeMultiple("DELETE FROM accounts")).rejects.toMatchObject({ status: 503 });
    expect(raw.batch).not.toHaveBeenCalled();
    await client.execute("SELECT 1");
  });
  it("wraps network failures without leaking SQL, supports batches and refuses migrations", async () => {
    const { client, raw } = fixture();
    raw.execute.mockRejectedValueOnce(new Error("HTTP 503 with secret"));
    await expect(client.execute("INSERT INTO accounts VALUES (1)")).rejects.toMatchObject({ code: "DATABASE_WRITE_UNCONFIRMED" });
    await client.batch(["INSERT INTO accounts VALUES (1)"], "write");
    await client.executeMultiple("DELETE FROM accounts");
    await expect(client.migrate([])).rejects.toThrow("remote");
    await client.reconnect();
    client.close();
    expect(client.protocol).toBe("file");
    expect(client.closed).toBe(false);
    expect(raw.reconnect).toHaveBeenCalledOnce();
    expect(raw.close).toHaveBeenCalledOnce();
  });
  it("releases the queue even when transaction close throws", async () => {
    const { client, tx } = fixture();
    const transaction: Transaction = await client.transaction();
    tx.close.mockImplementationOnce(() => { throw new Error("close failed"); });
    expect(() => transaction.close()).toThrow("close failed");
    await client.execute("SELECT 1");
  });
});

describe("safe database errors", () => {
  it("unwraps Drizzle causes for action and API responses", async () => {
    const error = new Error("Failed SQL with private parameters", { cause: databaseUnavailable(true) });
    expect(replicaError(error)?.code).toBe("DATABASE_WRITE_UNCONFIRMED");
    expect(actionError(error).code).toBe("DATABASE_WRITE_UNCONFIRMED");
    const response = databaseErrorResponse(error)!;
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private");
    expect(databaseErrorResponse(new Error("other"))).toBeUndefined();
    expect(replicaError(null)).toBeUndefined();
    expect(isConnectionFailure("network")).toBe(false);
  });
});
