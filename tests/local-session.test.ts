import { describe, expect, it } from "vitest";
import { createSession, createUnlock, readSession, readUnlock, signCookie } from "@/lib/auth/local-session";
import { hashPin, pinSchema, verifyPin } from "@/lib/auth/pin";
const session = createSession({ email: "owner@example.com", uid: "owner" }, 2);
const settings = { lockTimeoutMinutes: 15, lockOnClose: true };
describe("signed local cookies", () => {
  it("round-trips sessions, rejects tampering, malformed input, wrong purpose, and expiry", () => {
    const cookie = signCookie(session, "session");
    expect(readSession(cookie)).toEqual(session);
    const [payload, signature] = cookie.split(".");
    for (const value of [undefined, "", "firebase", `${payload}.a`, `${payload}.${signature}.extra`, `${payload}.!`, `e30.${signature}`, signCookie(session, "unlock"), "x".repeat(8001)]) expect(readSession(value)).toBeNull();
    expect(readSession(cookie, session.exp * 1000)).toBeNull();
    expect(readSession(signCookie({ ...session, iat: session.exp }, "session"))).toBeNull();
    expect(readSession(signCookie({ ...session, v: 2 } as never, "session"))).toBeNull();
  });
  it("binds unlocks to email, version, process and inactivity, with canonical settings", () => {
    const unlock = createUnlock(session, settings);
    const cookie = signCookie(unlock, "unlock");
    expect(readUnlock(cookie, session, settings)).toEqual(unlock);
    expect(readUnlock(cookie, { ...session, ver: 3 }, settings)).toBeNull();
    expect(readUnlock(cookie, { ...session, email: "other@example.com" }, settings)).toBeNull();
    expect(readUnlock(cookie, session, settings, unlock.lastActivity + 900000)).toBeNull();
    expect(readUnlock(cookie, session, settings, unlock.lastActivity - 1)).toBeNull();
    expect(readUnlock(signCookie({ ...unlock, bootId: "old-process" }, "unlock"), session)).toBeNull();
    expect(readUnlock(cookie, session, { ...settings, lockTimeoutMinutes: 1 })).toBeNull();
    expect(readUnlock(undefined, session)).toBeNull();
    const persistent = signCookie(createUnlock(session, { ...settings, lockOnClose: false }), "unlock");
    expect(readUnlock(persistent, session)).not.toBeNull();
    expect(readUnlock(persistent, session, settings)).toBeNull();
  });
});
describe("scrypt PINs", () => {
  it("salts each hash, verifies the PIN, rejects malformed hashes and inputs", async () => {
    const first = await hashPin("012345"); const second = await hashPin("012345");
    expect(first).toMatch(/^scrypt:v1:[a-f0-9]{32}:[a-f0-9]{128}$/); expect(first).not.toBe(second);
    expect(await verifyPin("012345", first)).toBe(true); expect(await verifyPin("012346", first)).toBe(false);
    expect(await verifyPin("abcdef", first)).toBe(false); expect(await verifyPin("012345", "invalid")).toBe(false);
    for (const input of [123456, "12345", "1234567", "12 456"]) expect(pinSchema.safeParse(input).success).toBe(false);
    await expect(hashPin("123")).rejects.toThrow();
  });
});
