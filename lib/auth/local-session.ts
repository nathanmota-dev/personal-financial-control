import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import { SESSION_SECONDS } from "./config";
import { maxLockTimeoutMinutes } from "./lock-timeout";
import type { LocalSession, LockSettings, UnlockSession } from "@/lib/interfaces/local-auth";

// Stable across Next bundles in the same server process, new after a restart.
export const bootId = `${process.pid}:${performance.timeOrigin}`;
const keys = new Map<string, Buffer>();
function key(purpose: string) {
  let result = keys.get(purpose);
  if (!result) {
    const secret = Buffer.from(process.env.DATA_ENCRYPTION_KEY ?? "", "base64");
    if (secret.length !== 32) throw new Error("Invalid DATA_ENCRYPTION_KEY");
    result = Buffer.from(hkdfSync("sha256", secret, "pfc:v2", purpose, 32));
    keys.set(purpose, result);
  }
  return result;
}
export function signCookie(payload: LocalSession | UnlockSession, purpose: "session" | "unlock") {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${createHmac("sha256", key(purpose)).update(value).digest("base64url")}`;
}
function readCookie(value: string | undefined, purpose: "session" | "unlock"): unknown {
  if (!value || value.length > 8000) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined || !/^[\w-]+$/.test(signature)) return null;
  const expected = createHmac("sha256", key(purpose)).update(payload).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
}
const sessionSchema = z.object({
  v: z.literal(1), email: z.string().email(), uid: z.string().min(1),
  name: z.string().optional(), picture: z.string().optional(),
  iat: z.number().int(), exp: z.number().int(), ver: z.number().int().nonnegative(),
});
const unlockSchema = z.object({
  email: z.string().email(), ver: z.number().int().nonnegative(), lastActivity: z.number().int(),
  timeout: z.number().int().min(0).max(maxLockTimeoutMinutes), bootId: z.string().optional(),
});
export function readSession(value?: string, now = Date.now()): LocalSession | null {
  const result = sessionSchema.safeParse(readCookie(value, "session"));
  if (!result.success || result.data.exp <= now / 1000 || result.data.iat > now / 1000 + 30) return null;
  return result.data;
}
export function createSession(identity: Pick<LocalSession, "email" | "uid" | "name" | "picture">, ver: number): LocalSession {
  const iat = Math.floor(Date.now() / 1000);
  return { ...identity, v: 1, ver, iat, exp: iat + SESSION_SECONDS };
}
export function createUnlock(session: LocalSession, settings: LockSettings): UnlockSession {
  return { email: session.email, ver: session.ver, lastActivity: Date.now(), timeout: settings.lockTimeoutMinutes,
    ...(settings.lockOnClose ? { bootId } : {}) };
}
export function readUnlock(value: string | undefined, session: LocalSession, settings?: LockSettings, now = Date.now()): UnlockSession | null {
  const parsed = unlockSchema.safeParse(readCookie(value, "unlock"));
  if (!parsed.success) return null;
  const unlock = parsed.data;
  const timeout = settings?.lockTimeoutMinutes ?? unlock.timeout;
  if ((settings && (unlock.timeout !== settings.lockTimeoutMinutes || (unlock.bootId !== undefined) !== settings.lockOnClose)) ||
      unlock.email !== session.email || unlock.ver !== session.ver || unlock.lastActivity > now ||
      (timeout > 0 && now - unlock.lastActivity >= timeout * 60000) ||
      (unlock.bootId !== undefined && unlock.bootId !== bootId) ||
      (settings?.lockOnClose && unlock.bootId !== bootId)) return null;
  return unlock;
}
