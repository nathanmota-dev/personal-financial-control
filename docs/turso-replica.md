# Réplica local do Turso

A opção D usa o mesmo banco Turso como fonte dos dados. As consultas financeiras e de autorização leem uma réplica SQLite no computador. As gravações continuam indo ao Turso, com leitura imediata das próprias alterações. Não há fila de gravações offline.

## Ativar

Mantenha a URL remota e o token atuais. Acrescente ao `.env`:

```dotenv
TURSO_REPLICA_PATH=".local/replica/finance.db"
TURSO_SYNC_INTERVAL="30"
```

Não troque `DATABASE_URL` pela URL do arquivo local. Quando ambas estiverem presentes, `DATABASE_URL` continua tendo precedência sobre `TURSO_DATABASE_URL`. A réplica exige uma URL `libsql://` ou `https://` e um token válido.

Execute `npm run db:migrate` e reinicie o servidor. O launcher Linux e o Docker executam as migrações antes de iniciar. O primeiro acesso ao banco baixa a réplica e verifica a versão do esquema antes de liberar consultas. O primeiro acesso e o desbloqueio por PIN exigem conexão. Não há conversão ou upload automático de um SQLite independente já existente.

O diretório da réplica precisa ser privado (0700); o app cria novos diretórios com essa permissão, mas não altera permissões de diretórios existentes. O arquivo e os metadados de controle têm permissão 0600. Use uma subpasta dedicada. Todo o conteúdo financeiro continua com a criptografia por campo existente; metadados do SQLite não recebem criptografia adicional do arquivo.

No Docker Compose, a URL remota configurada prevalece sobre o padrão SQLite independente. O caminho relativo acima fica em `/app/.local/replica/finance.db`, no volume persistente já existente. Para `docker run` direto, passe explicitamente a URL remota e as demais variáveis.

## Funcionamento

- Um único cliente e uma inicialização compartilhada por processo atendem páginas, actions e APIs; os objetos Drizzle permanecem em seus respectivos bundles.
- As consultas não aguardam uma sincronização a cada navegação. Sincronizações periódicas e operações são coordenadas; uma transação mantém a reserva até terminar.
- O app sincroniza a cada 30 segundos, ao voltar à janela, ao recuperar conexão e pelo botão **Sincronizar agora**. O intervalo é configurável entre 1 e 86400 segundos.
- Mudanças recebidas atualizam a tela e invalidam a memória de geração de recorrências. Atualizações visuais são adiadas enquanto houver um diálogo aberto ou um campo em edição.
- Se a conexão cair após a inicialização, uma sessão já desbloqueada continua consultando a última réplica disponível. As regras de inatividade e PIN permanecem; um novo login ou desbloqueio exige conexão.
- Falhas de sincronização mostram **somente consulta**. Gravações ficam bloqueadas até uma sincronização bem-sucedida. O gerador de recorrências aguarda a recuperação.
- Uma resposta perdida durante a gravação pode ter ocorrido depois do commit remoto. O app informa que a gravação não foi confirmada e não tenta novamente automaticamente. Sincronize e confira os dados antes de repetir.
- Mudanças de autorização feitas em outro computador chegam na sincronização seguinte; durante a desconexão a sessão continua usando a autorização e os limites de validade locais.

Os endpoints `GET /api/database/sync` (estado) e `POST /api/database/sync` (sincronização) exigem sessão desbloqueada. O POST também verifica a origem. As respostas são privadas, sem cache, e não expõem credenciais ou caminhos.

## Trocar de PC ou recuperar a réplica

1. Instale a mesma versão do aplicativo.
2. Configure o mesmo banco Turso, um token válido e o mesmo projeto Firebase.
3. Restaure a **mesma `DATA_ENCRYPTION_KEY`**. Uma chave nova não abre os dados antigos.
4. Configure um caminho de réplica novo e inicie com internet. Faça login e desbloqueie o app.

Guarde a chave fora do computador. O arquivo da réplica é reconstruível; a chave não é recuperada pelo Turso. Sincronização também propaga exclusões e não substitui um backup histórico.

Para reconstruir uma réplica, pare o processo e escolha um novo caminho. Não abra o arquivo com outro cliente SQLite durante o uso. A identidade local impede reutilizar a réplica para outro banco ou outra chave.

## Travas e reversão

Um arquivo `.lock` reserva a réplica para um processo. Desenvolvimento e produção devem usar caminhos distintos se rodarem juntos. O encerramento normal libera a trava. Depois de uma interrupção abrupta, confirme que o PID registrado na trava não está mais em execução antes de remover **somente** o `.lock`. O app não remove automaticamente uma trava potencialmente ativa.

Para voltar ao acesso remoto direto, remova `TURSO_REPLICA_PATH` e reinicie. Não é necessário alterar nem restaurar o Turso. Migrações, seed e importação por CLI usam a conexão de origem, sem abrir a réplica ativa.

## Validação reproduzível

Os testes automatizados cobrem configuração, inicialização compartilhada, sincronização, exclusão entre transações e consultas, erros, trava, APIs e interface. O teste de integração usa um libSQL isolado, sem credenciais de produção:

```bash
docker run --rm -d --name pfc-replica-integration -p 127.0.0.1:18089:8080 ghcr.io/tursodatabase/libsql-server@sha256:6dd3eb276d9d3604e4a48ac4a999a2e267814732d57d7e94c04ba71482333a67
node --import tsx tests/integration/replica.ts --stop-test-server
```

A opção `--stop-test-server` encerra somente esse container de teste para verificar uma queda real de conexão. O teste valida gravação remota, criptografia, leitura imediata, duas réplicas, rollback, consultas concorrentes e reconstrução após apagar a réplica.

A redução de tempo das páginas depende também da renderização e dos cálculos locais. A expectativa de menos de 200 ms do estudo original não é uma garantia; os microbenchmarks e a integração não substituem a medição das dez abas no navegador.

## Medição de leitura em 29/10/2026

Com dados atuais e operações limitadas a SELECT, cinco amostras aquecidas por serviço deram estas medianas:

| Serviço | Turso direto | Réplica | Redução |
|---|---:|---:|---:|
| Dashboard | 1.671,78 ms | 183,10 ms | 89,0% |
| Cartão | 1.773,32 ms | 123,04 ms | 93,1% |
| Lançamentos | 148,84 ms | 5,99 ms | 96,0% |
| Saldo projetado | 642,98 ms | 164,30 ms | 74,4% |

Os resultados dos dois modos foram comparados antes da medição. Inicialização da réplica: 3.820,81 ms. São tempos de serviços no servidor, incluindo descriptografia e cálculos; não são tempos das páginas completas. A navegação nas dez abas e as gravações ainda não foram medidas nesta rodada.
