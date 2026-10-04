import { getEncryptionKey } from "@/lib/crypto/money";
import { createCipheriv,createDecipheriv,createHmac,hkdfSync,randomBytes } from "node:crypto";

export type ContentType = "text" | "integer" | "boolean" | "timestamp";
export type ContentValue = string | number | boolean | Date;

function derivedKey(purpose: string, key: Buffer) {
  return Buffer.from(hkdfSync("sha256", key, "pfc:v2", purpose, 32));
}
function validate(value: unknown, type: ContentType): asserts value is ContentValue {
  const valid = type === "text" ? typeof value === "string"
    : type === "boolean" ? typeof value === "boolean"
    : type === "timestamp" ? value instanceof Date && Number.isSafeInteger(value.getTime())
    : typeof value === "number" && Number.isSafeInteger(value);
  if (!valid) throw new Error(`Invalid encrypted ${type} value.`);
}
function canonical(value: ContentValue, type: ContentType) {
  validate(value, type);
  return JSON.stringify(type === "timestamp" ? (value as Date).getTime() : value);
}
function decode(value: string) {
  const bytes = Buffer.from(value, "base64url");
  if (bytes.toString("base64url") !== value) throw new Error("Malformed encrypted content.");
  return bytes;
}
export function encryptContent(value: ContentValue, context: string, type: ContentType, key = getEncryptionKey()) {
  const plaintext = canonical(value, type);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey("content", key), nonce);
  cipher.setAAD(Buffer.from(JSON.stringify(["pfc:v2", context, type])));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ["pfc", "v2", nonce.toString("base64url"), ciphertext.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(":");
}
export function decryptContent(payload: string, context: string, type: ContentType, key = getEncryptionKey()): ContentValue {
  if (typeof payload !== "string") throw new Error("Malformed encrypted content.");
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "pfc" || parts[1] !== "v2") throw new Error("Malformed encrypted content.");
  const [nonce, ciphertext, tag] = parts.slice(2).map(decode);
  if (nonce.length !== 12 || tag.length !== 16 || !ciphertext.length) throw new Error("Malformed encrypted content.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", derivedKey("content", key), nonce);
    decipher.setAAD(Buffer.from(JSON.stringify(["pfc:v2", context, type])));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext);
    const value = type === "timestamp" ? new Date(parsed) : parsed;
    validate(value, type);
    if (canonical(value, type) !== plaintext) throw new Error("Invalid encrypted content.");
    return value;
  } catch {
    throw new Error(`Encrypted content could not be authenticated: ${context} (${type}).`);
  }
}
export function contentIndex(values: unknown[], context: string, key = getEncryptionKey()) {
  return createHmac("sha256", derivedKey("indexes", key)).update(JSON.stringify(["pfc:v2", context, values])).digest("hex");
}
