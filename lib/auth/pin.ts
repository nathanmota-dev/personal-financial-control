import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

export const pinSchema = z.string().regex(/^\d{6}$/);
const derive = promisify(scrypt);
export async function hashPin(pin: string) {
  pinSchema.parse(pin);
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(pin, salt, 64) as Buffer;
  return `scrypt:v1:${salt}:${hash.toString("hex")}`;
}
export async function verifyPin(pin: string, encoded: string) {
  if (!pinSchema.safeParse(pin).success) return false;
  const match = /^scrypt:v1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(encoded);
  if (!match) return false;
  const hash = await derive(pin, match[1], 64) as Buffer;
  return timingSafeEqual(hash, Buffer.from(match[2], "hex"));
}
