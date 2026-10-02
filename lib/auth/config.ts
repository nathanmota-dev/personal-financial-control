export const SESSION_SECONDS = 14 * 24 * 60 * 60;
export function authConfig(environment = process.env.NODE_ENV) {
  const urlVariable = environment === "development" ? "APP_URL_DEVELOPMENT" : "APP_URL";
  const origin = new URL(process.env[urlVariable] || "invalid");
  if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password || (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)))) throw new Error(`Invalid ${urlVariable}`);
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || !process.env.NEXT_PUBLIC_FIREBASE_APP_ID || !projectId || projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) throw new Error("Authentication unavailable");
  return { origin: origin.origin, projectId, secure: origin.protocol === "https:" };
}

export function isAllowedOrigin(value: string | null, canonical: string) {
  if (value === canonical) return true;
  if (process.env.NODE_ENV !== "development" || !value) return false;
  try {
    const actual = new URL(value);
    const expected = new URL(canonical);
    const loopback = ["localhost", "127.0.0.1", "[::1]"];
    return actual.origin === value && actual.protocol === expected.protocol && actual.port === expected.port && loopback.includes(actual.hostname) && loopback.includes(expected.hostname);
  } catch { return false; }
}
export function safeDestination(value: string | undefined) {
  if (typeof value !== "string" || !value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://internal.invalid");
    const pathname = decodeURIComponent(url.pathname);
    return url.origin === "https://internal.invalid" && pathname !== "/login" && pathname !== "/api" && !pathname.startsWith("/api/") && !/[\\\x00-\x20]/.test(pathname) && !pathname.startsWith("//") ? url.pathname + url.search : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
