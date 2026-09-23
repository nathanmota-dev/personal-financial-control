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

Antes de iniciar fora do Docker, preencha no `.env` `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` com as credenciais do Turso. O primeiro início instala as dependências se necessário, gera o build quando houver alterações, aplica as migrações, inicia o servidor na porta `3007` e abre o app no navegador configurado.

Se o projeto for movido para outra pasta, execute `./install-app.sh` novamente para atualizar o launcher.

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
receitas, despesas e compras de cartão. Ele aceita apenas conexões loopback e fica
desabilitado quando `PFC_MCP_TOKEN` não existe ou tem menos de 32 caracteres.

Gere um token e adicione-o ao `.env`:

```bash
openssl rand -hex 32
# .env
PFC_MCP_TOKEN="cole-o-token-aqui"
```

Exporte o mesmo valor no ambiente que inicia o Codex (o Codex não lê o `.env` do app
para preencher cabeçalhos):

```bash
export PFC_MCP_TOKEN="cole-o-token-aqui"
```

Inicie o app e crie a configuração local `.codex/config.toml`, que é ignorada pelo
Git. Use a porta real do processo: normalmente `3000` com `npm run dev` e `3007` com
Docker ou os scripts locais. O token não deve ser escrito nesse arquivo;
`bearer_token_env_var` recebe somente o nome da variável de ambiente. Consulte
[a documentação completa dos comandos MCP](docs/MCP.md#configuração-rápida) para
copiar a configuração. Em um projeto confiável, confirme a conexão com
`codex mcp list`; na interface do Codex, use `/mcp`.

As ferramentas esperam datas `YYYY-MM-DD`, meses `YYYY-MM`, valores inteiros em
centavos e chaves idempotentes estáveis no formato `origem:periodo:linha`. Consulte
as referências antes de importar e envie uma linha do documento por chamada.

Consulte [a documentação completa dos comandos MCP](docs/MCP.md) para ver todos os
contratos, exemplos de argumentos, respostas, erros e o fluxo recomendado de
importação.

## Desenvolvimento

Para executar o servidor de desenvolvimento:

```bash
npm install
npm run dev
```
