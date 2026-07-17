import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "pfc:v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const INTEGER_PATTERN = /^-?(?:0|[1-9]\d*)$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
let ephemeralDemoKey: Buffer | undefined;

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

export function parseEncryptionKey(encodedKey: string) {
  const normalized = encodedKey.trim();

  if (!BASE64_PATTERN.test(normalized)) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }

  const key = Buffer.from(normalized, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }

  return key;
}

export function getEncryptionKey() {
  const encodedKey = process.env.DATA_ENCRYPTION_KEY;

  if (!encodedKey) {
    const demoMode = ["true", "1", "yes", "on"].includes(
      process.env.DEMO_MODE?.trim().toLowerCase() ?? ""
    );

    if (demoMode) {
      ephemeralDemoKey ??= randomBytes(KEY_LENGTH);
      return ephemeralDemoKey;
    }

    throw new Error("DATA_ENCRYPTION_KEY is required to access monetary data.");
  }

  return parseEncryptionKey(encodedKey);
}

function assertMoneyValue(value: number) {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Monetary values must be safe integers in cents.");
  }
}

export function encryptMoney(value: number, context: string, key = getEncryptionKey()) {
  assertMoneyValue(value);

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${VERSION}:${encode(iv)}:${encode(ciphertext)}:${encode(authTag)}`;
}

export function decryptMoney(
  payload: string,
  context: string,
  key = getEncryptionKey()
) {
  if (typeof payload !== "string") {
    throw new Error("Encrypted monetary value is malformed.");
  }

  const parts = payload.split(":");

  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== VERSION) {
    throw new Error("Encrypted monetary value is malformed.");
  }

  const iv = decode(parts[2]);
  const ciphertext = decode(parts[3]);
  const authTag = decode(parts[4]);

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH ||
    ciphertext.length === 0
  ) {
    throw new Error("Encrypted monetary value is malformed.");
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    if (!INTEGER_PATTERN.test(plaintext)) {
      throw new Error("Encrypted monetary value is invalid.");
    }

    const value = Number(plaintext);
    assertMoneyValue(value);

    if (String(value) !== plaintext) {
      throw new Error("Encrypted monetary value is invalid.");
    }

    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "Encrypted monetary value is invalid.") {
      throw error;
    }

    throw new Error("Encrypted monetary value could not be authenticated.");
  }
}

export function isEncryptedMoneyPayload(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${VERSION}:`);
}

export const moneyEncryptionVersion = VERSION;
