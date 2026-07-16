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
BROWSER_BIN="brave"
```

Essa é a configuração usada atualmente para abrir o app no Brave. Para usar o Chrome, altere a flag para o executável disponível no sistema, por exemplo:

```env
BROWSER_BIN="google-chrome"
```

Também é possível testar a alteração sem editar o arquivo:

```bash
BROWSER_BIN=google-chrome ./open-app.sh
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
- `BROWSER_BIN`: executável usado pelo launcher do Linux.

Mantenha a mesma `DATA_ENCRYPTION_KEY` enquanto houver dados criptografados; trocá-la impede a leitura desses dados.

## Desenvolvimento

Para executar o servidor de desenvolvimento:

```bash
npm install
npm run dev
```
