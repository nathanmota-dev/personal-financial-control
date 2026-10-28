// Replace only the Firebase SDK in this disposable server process.
// Application guards, origin protection, allowlist lookup and persistence stay real.
import { registerHooks } from "node:module";
const app = `export const cert = () => ({}); export const getApps = () => [{ name: "pfc-auth" }]; export const initializeApp = () => ({});`;
const auth = `export const getAuth = () => ({
  verifyIdToken: async token => {
    if (!["onboarding-a", "onboarding-b"].includes(token)) throw { code: "auth/invalid-id-token" };
    return { uid: token, name: "Ana Lima", email: token + "@example.test", email_verified: true, firebase: { sign_in_provider: "google.com" }, auth_time: Math.floor(Date.now() / 1000) };
  }
});`;
registerHooks({ resolve(specifier, context, nextResolve) {
  // Turbopack gives external packages a hash suffix in standalone builds.
  const match = /^firebase-admin(?:-[a-f0-9]+)?\/(app|auth)$/.exec(specifier);
  if (match) return { url: `data:text/javascript,${encodeURIComponent(match[1] === "app" ? app : auth)}`, shortCircuit: true };
  return nextResolve(specifier, context);
} });
