// Server-side flag only: never enable public access from a client parameter.
export function isDemoMode() {
  return ["true", "1", "yes", "on"].includes(
    process.env.DEMO_MODE?.trim().toLowerCase() ?? ""
  );
}
