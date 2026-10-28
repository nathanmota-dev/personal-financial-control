import { bench, describe } from "vitest";
import { createSession, createUnlock, readSession, readUnlock, signCookie } from "@/lib/auth/local-session";
import { benchmarkOptions } from "./fixtures";
process.env.DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
const session = createSession({ email: "benchmark@example.test", uid: "benchmark" }, 0);
const cookie = signCookie(session, "session");
const unlock = signCookie(createUnlock(session, { lockTimeoutMinutes: 15, lockOnClose: true }), "unlock");
describe("Local authentication", () => {
  bench("verify session and unlock HMAC cookies", () => {
    const identity = readSession(cookie);
    if (!identity || !readUnlock(unlock, identity)) throw new Error("Invalid benchmark session");
  }, benchmarkOptions);
});
