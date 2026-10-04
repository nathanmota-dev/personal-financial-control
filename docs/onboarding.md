# Configuração inicial

O layout financeiro consulta `user_onboarding` depois de validar a sessão Firebase.
Cada UID começa na etapa 1, inclusive usuários com contas ou cartões já cadastrados.
O modal carrega sob demanda e a demo pública não monta o fluxo.

Cada navegação é gravada antes de exibir a próxima etapa. Contas e cartões são
salvos separadamente com a ação existente; rascunhos não enviados são descartados.
Fechar por X ou Escape apenas oculta o modal até a próxima recarga ou entrada.
Concluir ou pular a configuração registra o primeiro timestamp de encerramento e
leva ao Dashboard. A gravação atômica ignora todo progresso posterior, inclusive
requisições atrasadas de outra aba. Recuperar o foco consulta novamente o estado.

## Publicação

Execute `npm run db:migrate` com as credenciais do banco de destino **antes de
publicar** a versão que consulta `user_onboarding`. A migration incremental
`0018_user_onboarding` está registrada no journal; o migrador também a aplica em
bancos novos. Não há migração automática durante requisições da aplicação.

## Testes

Os testes de banco usam SQLite temporário. O E2E autenticado usa o build standalone,
um banco descartável e um preload Node que simula somente o SDK Firebase no
processo de testes. Guards, autorização por email, proteção de origem, Server
Actions e persistência continuam reais. Não existe bypass de autenticação na aplicação.
