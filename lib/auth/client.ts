import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";
export async function googleLogin() {
  const config = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
  if (Object.values(config).some(value => !value)) throw new Error("Login indisponível. Configure o Firebase.");
  const auth = getAuth(getApps()[0] ?? initializeApp(config));
  await setPersistence(auth, inMemoryPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, provider);
    const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await result.user.getIdToken() }) });
    if (!response.ok) throw new Error(response.status === 403 ? "Esta conta não tem permissão para acessar." : "Não foi possível iniciar a sessão. Tente novamente.");
  } finally { await signOut(auth); }
}
