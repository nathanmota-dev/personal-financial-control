# Sessão local e PIN

Após o login Google, defina um PIN numérico de 6 dígitos. O Google é consultado
somente no login; as requisições seguintes verificam cookies HMAC e autorização
no banco local. A sessão dura 14 dias. Cookies Firebase antigos exigem novo login.
Execute a migração normal (`npm run db:migrate`) antes de iniciar esta versão.

## Configurações

Em **Configurações → Segurança**, troque o PIN, ajuste a inatividade de 1 a 120
minutos (padrão: 15) e escolha se o app trava ao fechar (padrão: ligado).
O heartbeat respeita um intervalo de 1 minuto; com timeout de apenas 1 minuto,
usamos 30 segundos para evitar bloqueio durante interação contínua.
O reinício do processo invalida o desbloqueio quando essa opção está ligada.
Evite “continuar de onde parou” no perfil dedicado do navegador: a restauração
pode conservar cookies de sessão se o servidor não for reiniciado.

## Bloqueios e saída

Cinco PINs errados invalidam todas as sessões e exigem login Google novamente.
“Esqueci o PIN” encerra a sessão e exige novo login Google antes de definir outro.
“Sair” invalida todas as sessões locais. O nome do perfil é salvo localmente.
O PIN protege contra acesso casual; não substitui o bloqueio do sistema operacional
nem cifra os dados com uma chave derivada do PIN. O modo demo continua sem PIN.

O MCP usa um token próprio gerado em Segurança, independente do bloqueio e logout.
Veja [a configuração do MCP](mcp.md).
