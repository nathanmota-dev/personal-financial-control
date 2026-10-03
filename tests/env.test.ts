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
