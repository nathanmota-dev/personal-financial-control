import type { ZodType } from "zod";

/** One MCP tool definition as captured while registering, before it is adapted for the chat. */
export type CapturedMcpTool = {
  name: string;
  description: string;
  inputSchema: ZodType;
  readOnly: boolean;
  run: (input: unknown) => Promise<{ structuredContent?: unknown }>;
};
