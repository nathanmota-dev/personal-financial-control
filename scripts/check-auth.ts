import { loadEnvConfig } from "@next/env";
import { createPrivateKey } from "node:crypto";
import { authConfig } from "../lib/auth/config";

loadEnvConfig(process.cwd(), process.argv.includes("--development"));

async function main() {
  let config;
  try {
    config = authConfig();
    createPrivateKey(process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  } catch {
    throw new Error("Configuração local inválida. Confira APP_URL, as variáveis Firebase, os IDs de projeto e o formato da chave privada.");
  }
  console.log("Configuração local e formato da chave privada válidos.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY!)}`, { signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok) {
    if (body.error?.message === "CONFIGURATION_NOT_FOUND") {
      throw new Error("CONFIGURATION_NOT_FOUND: abra Firebase Console > Authentication > Começar no projeto da API key. Depois habilite Google em Sign-in method e configure os domínios autorizados. Confira se a API key pertence ao mesmo projeto do .env.");
    }
    throw new Error(`Firebase recusou a consulta (HTTP ${response.status}). Confira a API key e suas restrições no console.`);
  }
  const hostname = new URL(config.origin).hostname;
  if (!body.authorizedDomains?.includes(hostname)) {
    throw new Error("O domínio de APP_URL não está em Authentication > Settings > Authorized domains.");
  }
  console.log("Firebase Authentication disponível e domínio de APP_URL autorizado. Valide o provedor Google entrando no navegador; este diagnóstico não autentica um usuário nem valida as permissões da conta de serviço.");
}

main().catch(error => {
  // Never print SDK/network errors: their request URLs can contain credentials.
  console.error(error instanceof Error && !["TypeError", "TimeoutError"].includes(error.name) ? error.message : "Não foi possível consultar o Firebase. Verifique a conexão e tente novamente.");
  process.exitCode = 1;
});
