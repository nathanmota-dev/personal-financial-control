// Replace only the Firebase SDK in this disposable server process.
// Application guards, origin protection, allowlist lookup and persistence stay real.
import { registerHooks } from "node:module";
const app = `export const cert = () => ({}); export const getApps = () => [{ name: "pfc-auth" }]; export const initializeApp = () => ({});`;
const auth = `const names = new Map(); export const getAuth = () => ({
  getUser: async uid => ({ uid, displayName: names.get(uid) ?? "Ana Lima" }),
  updateUser: async (uid, { displayName }) => { names.set(uid, displayName); return { uid, displayName }; },
  verifySessionCookie: async cookie => {
    if (!["onboarding-a", "onboarding-b"].includes(cookie)) throw { code: "auth/invalid-session-cookie" };
    return { uid: cookie, name: "Ana Lima", email: cookie + "@example.test", email_verified: true, firebase: { sign_in_provider: "google.com" } };
  }
});`;
registerHooks({ resolve(specifier, context, nextResolve) {
  // Turbopack gives external packages a hash suffix in standalone builds.
  const match = /^firebase-admin(?:-[a-f0-9]+)?\/(app|auth)$/.exec(specifier);
  if (match) return { url: `data:text/javascript,${encodeURIComponent(match[1] === "app" ? app : auth)}`, shortCircuit: true };
  return nextResolve(specifier, context);
} });
