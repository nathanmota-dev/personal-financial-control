const messages: Record<string, string> = {
  "auth/configuration-not-found": "O Firebase Authentication ainda não foi configurado. Ative Authentication e o provedor Google no console do Firebase.",
  "auth/operation-not-allowed": "O login Google não está habilitado no Firebase Authentication.",
  "auth/invalid-api-key": "A configuração do Firebase é inválida. Confira a API key do app Web e reinicie o app.",
  "auth/popup-closed-by-user": "Login cancelado. Você pode tentar novamente.",
  "auth/cancelled-popup-request": "Login cancelado. Você pode tentar novamente.",
  "auth/popup-blocked": "Permita popups neste navegador e tente novamente.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
  "auth/web-storage-unsupported": "Permita o armazenamento do navegador para o login Google e tente novamente.",
};

export function loginErrorMessage(failure: unknown, hostname: string): string {
  const code = failure !== null && typeof failure === "object" && "code" in failure
    && typeof failure.code === "string" ? failure.code : "";

  if (code === "auth/unauthorized-domain") {
    return `O domínio ${hostname} não está autorizado no Firebase Authentication. Adicione ${hostname} em Authentication > Settings > Authorized domains. Depois, recarregue a tela e tente novamente.`;
  }
  if (Object.hasOwn(messages, code)) return messages[code];
  if (failure instanceof TypeError) return messages["auth/network-request-failed"];
  return failure instanceof Error ? failure.message : "Não foi possível entrar. Tente novamente.";
}
