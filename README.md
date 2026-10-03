# Personal Financial Control

O Personal Financial Control é um app web de finanças pessoais. Ele ajuda a organizar contas, categorias, lançamentos, transferências, recorrências, cartões, investimentos, metas e projeções de saldo.

Há duas formas de iniciar o app: usando Docker ou instalando um launcher no menu de aplicativos do Linux.

## 1. Iniciar com Docker

Pré-requisitos:

- Docker;
- Docker Compose, disponível pelo comando `docker compose`.

Se ainda não existir um `.env`, crie-o a partir do exemplo:

```bash
cp .example.env .env
```

Preencha `DATA_ENCRYPTION_KEY` no `.env`. O Compose sempre sobrescreve `DATABASE_URL` com `file:/app/.local/personal-finance.db`, mesmo que o `.env` contenha configurações do Turso. O arquivo é criado e migrado automaticamente dentro do container.

Na raiz do projeto, rode:

```bash
docker compose up --build
```

Depois, acesse <http://localhost:3007>. O Compose aplica as migrações antes de iniciar o servidor. O SQLite é um arquivo local acessado pelo próprio app; não existe um serviço de banco separado. Os dados ficam no volume `personal_financial_control_data`.

Para iniciar em segundo plano:

```bash
docker compose up -d --build
```

Para parar o container:

```bash
docker compose down
```

Esse comando preserva o volume e os dados. Para remover também o banco local, use `docker compose down -v`.

## 2. Instalar como app no Linux

A instalação local usa Node.js, npm, um navegador baseado em Chromium e os scripts `.sh` do projeto. O `install-app.sh` registra o app no menu de aplicativos; o `open-app.sh` sobe o servidor e abre uma janela dedicada do navegador.

Com os pré-requisitos instalados, execute na raiz do projeto:

```bash
chmod +x ./*.sh
./install-app.sh
```

Depois, procure por `Finance` no menu de aplicativos do Linux. Para iniciar pelo terminal sem instalar o launcher, use:

```bash
./open-app.sh
```

Antes de iniciar fora do Docker, preencha no `.env` `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` com as credenciais do Turso. O primeiro início instala as dependências se necessário, gera o build quando houver alterações, aplica as migrações, inicia o servidor na porta configurada em `APP_URL` e abre o app no navegador configurado.

Se o projeto for movido para outra pasta, execute `./install-app.sh` novamente para atualizar o launcher.

O launcher usa `assets/finance-icon-rounded.png`, uma cópia da arte original de
`app/icon.png` com cantos arredondados e transparência. CSS do app não altera o
ícone do menu do Linux. Para atualizar o ícone instalado, execute
`./install-app.sh` novamente. Se o menu ainda mostrar a versão anterior, encerre
a sessão do Linux e entre novamente para renovar o cache do ambiente gráfico.

### Escolher o navegador

O navegador padrão está configurado no `.env`:

```env
BROWSER_BIN="google-chrome"
```

O Chrome é usado por padrão para abrir o app. Para usar outro navegador, altere o valor para o executável disponível no sistema, por exemplo:

```env
BROWSER_BIN="google-chrome-stable"
```

Também é possível testar outro navegador sem editar o arquivo:

```bash
BROWSER_BIN=chromium ./open-app.sh
```

Outros nomes comuns são `google-chrome-stable`, `chromium` e `chromium-browser`. O `.example.env` já contém a mesma flag para novas instalações.

### Scripts disponíveis

- `./install-app.sh`: instala ou atualiza o launcher `Finance` no menu do Linux;
- `./open-app.sh`: inicia o app em background, abre a janela dedicada e encerra o servidor ao fechar a janela;
- `./start-app.sh`: prepara o build, aplica as migrações e inicia apenas o servidor;
- `./open-app.sh` com `START_APP_SKIP_BROWSER=1`: valida a subida sem abrir o navegador;
- `./start-app.sh` com `START_APP_SKIP_SERVER=1`: valida dependências, build e migrações sem manter o servidor ativo.

Exemplo de porta diferente:

```bash
PORT=3008 ./open-app.sh
```

## Configuração e dados

`.env` é o arquivo usado localmente e não deve ser versionado. Use `.example.env` como modelo. As variáveis principais são:

- `DATABASE_URL`: URL do banco selecionado. No Docker, o Compose injeta `file:/app/.local/personal-finance.db` automaticamente;
- `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`: conexão com Turso quando `DATABASE_URL` não estiver definida;
- `DATA_ENCRYPTION_KEY`: chave base64 de 32 bytes usada para proteger os dados financeiros;
- `DEMO_MODE`: use `true`, `1`, `yes` ou `on` para carregar um portfólio simulado em memória. O padrão é `false`; alterações feitas no demo são temporárias e não exigem banco ou chave financeira reais;
- `BRAPI_API_TOKEN`: token opcional da brapi. Sem ele, apenas a atualização automática de cotações fica desabilitada; cotações manuais continuam disponíveis;
- `INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES`: intervalo mínimo entre consultas do mesmo ticker (padrão: `30`). Atualizações dentro desse intervalo são ignoradas;
- `BROWSER_BIN`: executável usado pelo launcher do Linux.

Mantenha a mesma `DATA_ENCRYPTION_KEY` enquanto houver dados criptografados; trocá-la impede a leitura desses dados.

## Integração MCP local com o Codex

O endpoint `POST /api/mcp` expõe ferramentas para consultar referências e administrar
receitas, despesas e compras de cartão. Ele aceita apenas conexões loopback,
exige o cookie Firebase e Origin igual à URL do ambiente. Faça login e configure os
cabeçalhos conforme [a documentação MCP](docs/mcp.md#configuração-rápida).

As ferramentas esperam datas `YYYY-MM-DD`, meses `YYYY-MM`, valores inteiros em
centavos e chaves idempotentes estáveis no formato `origem:periodo:linha`. Consulte
as referências antes de importar e envie uma linha do documento por chamada.

Consulte [a documentação completa dos comandos MCP](docs/mcp.md) para ver todos os
contratos, exemplos de argumentos, respostas, erros e o fluxo recomendado de
importação.

## Desenvolvimento

O projeto inclui verificações de qualidade, cobertura e performance para PRs.
Consulte [a documentação do quality gate](docs/quality-gate.md) para instalar as
dependências dos helpers, executar os comandos e revisar os relatórios.

Para executar o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

As versões transitivas em `overrides` no `package.json` corrigem alertas de
segurança enquanto os pacotes de origem ainda fixam versões antigas:
`@grpc/grpc-js` no Firestore, `uuid` no gaxios 6 e `esbuild` no loader do Drizzle.
Ao atualizar esses pacotes, reavalie os overrides e execute `npm audit`, build,
lint e a suíte completa de testes. Não use `npm audit fix --force`: ele pode
sugerir downgrades incompatíveis do Firebase e do Drizzle.

## Login Google

Preencha as variáveis Firebase em `.env` conforme `.example.env`. Habilite o
Google no Firebase Authentication e registre os domínios autorizados. Os IDs de
projeto público e Admin devem coincidir; somente e-mails verificados cadastrados na tabela `authorized_users`
podem entrar. A autorização é consultada no banco a cada requisição fora do modo demo. Aplique `npm run db:migrate` para criar a tabela; ela começa vazia
e não há cadastro público. A origem canônica depende do ambiente (HTTP somente em loopback, HTTPS remoto):

```env
APP_URL="http://127.0.0.1:3007"
APP_URL_DEVELOPMENT="http://localhost:3000"
```

`npm run dev` usa `APP_URL_DEVELOPMENT`; o build de produção, Docker e launcher Linux usam `APP_URL`.
Configure as duas variáveis: não há fallback entre ambientes. Autorize os dois hosts no Firebase.
Para `npm run dev`, use `http://localhost:3000`. Docker recebe as variáveis públicas
no build; refaça a imagem quando mudarem. Credenciais Admin são usadas apenas no
runtime. Nunca versione a chave privada.

A sessão persiste por 14 dias. Sair limpa o cookie deste navegador mesmo se a sessão
expirou ou foi revogada, mantendo a validação de Origin; em Configurações,
Sair de todos os dispositivos revoga todas as sessões, inclusive MCP. Sem configuração
válida o acesso financeiro permanece bloqueado fora do modo demo.

Com `DEMO_MODE=true` (também aceita `1`, `yes` ou `on`), a demo é pública:
`/login` mostra “Explorar demo”, que leva diretamente à rota interna solicitada
ou a `/dashboard`, sem Google, cookie de sessão ou cadastro de usuário autorizado.
Páginas, APIs financeiras e ações usam os dados simulados; Firebase e banco real
não são necessários. O aviso permanece visível dentro do app. As alterações são
temporárias e compartilhadas pelos visitantes da mesma instância; não insira dados
pessoais. Desative `DEMO_MODE` para voltar a exigir autenticação.

### Diagnóstico do login

Execute `npm run auth:check` (ou `npm run auth:check -- --development` para
usar `APP_URL_DEVELOPMENT` e carregar também `.env.development`). O comando verifica a configuração local, o formato da
chave privada e a disponibilidade do Authentication para a API key, sem imprimir
credenciais. Ele não substitui o teste real de login.

O app instalado no Linux usa `APP_URL` (por padrão, `http://127.0.0.1:3007`),
enquanto `npm run dev` usa `APP_URL_DEVELOPMENT` (`http://localhost:3000`).
O Firebase autoriza cada hostname separadamente: cadastrar `localhost` não autoriza
`127.0.0.1`. Em **Authentication > Settings > Authorized domains**, cadastre ambos,
sem protocolo ou porta. Se a janela fechar antes de mostrar o Google, confira o
domínio informado na mensagem da tela de login e execute:

```bash
npm run auth:check
npm run auth:check -- --development
```

O primeiro comando verifica a configuração usada pelo launcher Linux e o segundo,
a configuração de desenvolvimento. Após cadastrar um domínio, recarregue a tela
ou reabra o app para renovar a validação do Firebase. Alterar os domínios não exige
rebuild; alterações nas variáveis `NEXT_PUBLIC_FIREBASE_*` exigem um novo build
de produção.

Ao fechar a janela do Google, o Firebase pode levar cerca de 8–10 segundos para
reconhecer o cancelamento. Quando aparecer “Login cancelado”, o botão será liberado
para uma nova tentativa manual. Uma tentativa cancelada não cria uma sessão do app.

Se aparecer `CONFIGURATION_NOT_FOUND`:

1. Abra o mesmo projeto da API key em https://console.firebase.google.com/.
2. Acesse **Authentication > Começar** para inicializar o serviço.
3. Em **Sign-in method**, habilite **Google**, escolha o e-mail de suporte e salve.
4. Em **Settings > Authorized domains**, adicione `127.0.0.1`, `localhost` e o
   domínio de produção (sem protocolo ou porta).
5. Confira se as credenciais Web e Admin pertencem a esse projeto. Reinicie
   `npm run dev` após alterar o `.env`; no Docker, reconstrua a imagem.

Os launchers leem `.env*` com a mesma precedência do Next em produção e usam
`APP_URL` como origem canônica. No Docker, ajuste também `APP_PORT` para a porta
externa de `APP_URL` (padrão 3007). Em desenvolvimento, acesse
`http://localhost:3000` com `APP_URL_DEVELOPMENT` configurada para essa origem.

Em desenvolvimento, `localhost`, `127.0.0.1` e `[::1]` são aceitos na mesma porta
e protocolo de `APP_URL_DEVELOPMENT`. Em produção, a origem canônica continua obrigatória.
O endpoint de HMR do Next é liberado somente em desenvolvimento.
