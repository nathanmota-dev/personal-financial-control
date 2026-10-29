import { afterEach, describe, expect, it } from "vitest";

import { getServerEnv } from "@/lib/env";

const originalValues = {
  DEMO_MODE: process.env.DEMO_MODE,
  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  TOKEN: process.env.TOKEN,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalValues)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("server environment", () => {
  it("defaults demo mode to false", () => {
    delete process.env.DEMO_MODE;
    process.env.DATA_ENCRYPTION_KEY = "test-key";

    expect(getServerEnv().DEMO_MODE).toBe(false);
  });

  it("allows demo mode without persistent database credentials", () => {
    process.env.DEMO_MODE = "on";
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.TOKEN;

    const env = getServerEnv();

    expect(env.DEMO_MODE).toBe(true);
    expect(env.DATABASE_URL).toBe("file::memory:");
  });

  it("requires the encryption key outside demo mode", () => {
    process.env.DEMO_MODE = "off";
    delete process.env.DATA_ENCRYPTION_KEY;

    expect(() => getServerEnv()).toThrow("DATA_ENCRYPTION_KEY");
  });

  it("prefers an explicit SQLite URL without forwarding remote tokens", () => {
    process.env.DEMO_MODE = "off";
    process.env.DATA_ENCRYPTION_KEY = "test-key";
    process.env.DATABASE_URL = "file:./test-environment.db";
    process.env.TURSO_DATABASE_URL = "libsql://test.invalid";
    process.env.TURSO_AUTH_TOKEN = "test-turso-token";
    process.env.TOKEN = "test-token";

    expect(getServerEnv()).toMatchObject({
      DATABASE_URL: "file:./test-environment.db",
      TOKEN: undefined,
    });
  });

  it("uses Turso credentials or the test SQLite fallback when no explicit URL exists", () => {
    process.env.DEMO_MODE = "off";
    process.env.DATA_ENCRYPTION_KEY = "test-key";
    delete process.env.DATABASE_URL;
    delete process.env.TOKEN;
    process.env.TURSO_DATABASE_URL = "libsql://test.invalid";
    process.env.TURSO_AUTH_TOKEN = "test-turso-token";

    expect(getServerEnv()).toMatchObject({
      DATABASE_URL: "libsql://test.invalid",
      TOKEN: "test-turso-token",
    });

    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    expect(getServerEnv()).toMatchObject({
      DATABASE_URL: "file:./.tmp/test.db",
      TOKEN: undefined,
    });
  });
});

describe("embedded replica environment", () => {
  afterEach(() => {
    delete process.env.TURSO_REPLICA_PATH;
    delete process.env.TURSO_SYNC_INTERVAL;
  });
  it("keeps the remote URL and token separate from the replica path", () => {
    process.env.DEMO_MODE = "false";
    process.env.DATA_ENCRYPTION_KEY = "key";
    process.env.DATABASE_URL = "libsql://remote.invalid";
    process.env.TOKEN = "token";
    process.env.TURSO_REPLICA_PATH = ".local/replica/finance.db";
    expect(getServerEnv()).toMatchObject({ DATABASE_URL: "libsql://remote.invalid", TOKEN: "token", TURSO_SYNC_INTERVAL: 30, TURSO_REPLICA_PATH: ".local/replica/finance.db" });
  });
  it("rejects a local source, missing credentials, invalid paths and intervals", () => {
    process.env.DEMO_MODE = "false";
    process.env.DATA_ENCRYPTION_KEY = "key";
    process.env.TURSO_REPLICA_PATH = "replica.db";
    process.env.DATABASE_URL = "file:local.db";
    expect(() => getServerEnv()).toThrow("remote");
    process.env.DATABASE_URL = "libsql://remote.invalid";
    delete process.env.TOKEN; delete process.env.TURSO_AUTH_TOKEN;
    expect(() => getServerEnv()).toThrow("token");
    process.env.TOKEN = "token";
    process.env.TURSO_REPLICA_PATH = "file:replica.db";
    expect(() => getServerEnv()).toThrow("filesystem");
    process.env.TURSO_REPLICA_PATH = "replica.db";
    for (const value of ["0", "-1", "1.5", "invalid", "86401"]) {
      process.env.TURSO_SYNC_INTERVAL = value;
      expect(() => getServerEnv()).toThrow("TURSO_SYNC_INTERVAL");
    }
  });
});
