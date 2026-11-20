import { z } from "zod";

export const CHAT_MAX_MESSAGES = 40;
export const CHAT_MAX_BODY_BYTES = 200_000;
export const CHAT_MAX_STEPS = 8;
export const CHAT_TIMEOUT_MS = 90_000;

/** The messages are validated again against the tools by `validateUIMessages`; this only bounds the request. */
export const chatRequestSchema = z.object({
  messages: z.array(z.object({ id: z.string().max(200), role: z.enum(["user", "assistant"]), parts: z.array(z.unknown()).max(200) }).passthrough()).min(1).max(CHAT_MAX_MESSAGES),
});
