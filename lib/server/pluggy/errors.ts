import { DomainError } from "@/lib/server/errors";

// Upstream authentication failures use 502 because the browser treats 401 as an expired app session.
export function pluggyHttpError(status: number) {
  if (status === 401) return new DomainError("PLUGGY_UNAUTHORIZED", "A Pluggy recusou as credenciais configuradas.", 502);
  if (status === 403) return new DomainError("PLUGGY_FORBIDDEN", "A Pluggy negou o acesso a este recurso.", 502);
  if (status === 404) return new DomainError("PLUGGY_NOT_FOUND", "A Pluggy não encontrou este item ou conta.", 404);
  if (status === 429) return new DomainError("PLUGGY_RATE_LIMITED", "A Pluggy limitou as requisições. Tente novamente em alguns minutos.", 429);
  if (status >= 500) return new DomainError("PLUGGY_UNAVAILABLE", "A Pluggy está indisponível no momento.", 503);
  return new DomainError("PLUGGY_REQUEST_FAILED", "A Pluggy não aceitou a requisição.", 502);
}

export function pluggyNetworkError() {
  return new DomainError("PLUGGY_UNAVAILABLE", "Não foi possível conectar à Pluggy.", 503);
}

export function pluggyInvalidResponse() {
  return new DomainError("PLUGGY_INVALID_RESPONSE", "A Pluggy retornou uma resposta inválida.", 502);
}

export function pluggyNotConfigured() {
  return new DomainError("PLUGGY_NOT_CONFIGURED", "Configure as credenciais da Pluggy para usar o Open Finance.", 503);
}
