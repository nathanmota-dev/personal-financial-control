# Personal Financial Control

Sistema web de finanças pessoais para organizar contas, receitas, despesas,
transferências, cartões de crédito, investimentos e metas, com importação
automática dos dados do banco via Open Finance.

- [Experimentar sem configurar nada](#experimentar-sem-configurar-nada)
- [Configuração](#configuração)
- [Como executar](#como-executar)
- [Conectar seus bancos (Open Finance)](#conectar-seus-bancos-open-finance)
- [Documentação](#documentação)

## Experimentar sem configurar nada

O modo demo não precisa de banco nem de Firebase. Os dados são simulados e as
alterações são temporárias.

```bash
cp .example.env .env   # depois defina DEMO_MODE="true" no .env
npm ci
npm run dev
```

Acesse <http://localhost:3000> e clique em **Explorar demo**.

## Configuração

```bash
cp .example.env .env
openssl rand -base64 32   # gera o valor de DATA_ENCRYPTION_KEY
```

| Variável | Quando usar | Para quê |
|---|---|---|
| `DATA_ENCRYPTION_KEY` | Sempre | Protege os dados financeiros |
| `NEXT_PUBLIC_FIREBASE_*` e `FIREBASE_*` | Sempre | Login Google, com credenciais do mesmo projeto |
| `APP_URL` e `APP_URL_DEVELOPMENT` | Sempre | Endereços de produção e de desenvolvimento |
| `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` | Fora do Docker | Banco de dados |
| `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` | Opcional | [Importação dos bancos](#conectar-seus-bancos-open-finance) |
| `BRAPI_API_TOKEN` | Opcional | Cotações automáticas. Sem ele, informe as cotações à mão |
| `BROWSER_BIN` | Opcional | Navegador do app Linux (padrão: Google Chrome) |

Guarde a `DATA_ENCRYPTION_KEY` e não a troque: outra chave não consegue ler os
dados já gravados. Não versione o `.env`.

**Firebase:** em Authentication, habilite o login Google e autorize `localhost`,
`127.0.0.1` e o domínio de produção, se houver.

**Acesso:** não há cadastro público. Depois das migrações, inclua os e-mails
permitidos na tabela `authorized_users`.

## Como executar

### Docker

```bash
docker compose up -d --build
```

Acesse <http://127.0.0.1:3007>. O container cria o banco SQLite e aplica as
migrações. Os dados ficam no volume `personal_financial_control_data` e são
preservados por `docker compose down`; `docker compose down -v` apaga o banco.

### Aplicativo no Linux

Requer Node.js 24, npm, um navegador baseado em Chromium e XWayland em sessões
Wayland.

```bash
chmod +x ./*.sh
./install-app.sh
```

Abra **Finance** no menu de aplicativos, ou rode `./open-app.sh`. O primeiro
início prepara o build e aplica as migrações, e o servidor é encerrado ao fechar
a janela. Se mover o projeto de pasta, rode `./install-app.sh` de novo.

Se não abrir, veja os logs em `.local/runtime/`: `launcher.log` (build e
migrações), `server.log` (Next.js) e `browser.log` (navegador).

### Desenvolvimento

Requer Node.js 24 e npm.

```bash
npm ci
npm run db:migrate
npm run dev
```

Acesse <http://localhost:3000>.

## Conectar seus bancos (Open Finance)

O app importa lançamentos, compras no cartão, faturas e o valor dos investimentos
pelo [MeuPluggy](https://meu.pluggy.ai). A configuração tem três partes.

> O MeuPluggy só pode ser ligado à sua conta de desenvolvedor durante o teste de
> 15 dias da Pluggy. Depois disso, as conexões já feitas continuam funcionando.

**1. Na Pluggy: conecte os bancos e pegue as credenciais**

1. Crie uma conta em [meu.pluggy.ai](https://meu.pluggy.ai) e conecte seus bancos.
2. Crie uma conta de desenvolvedor em [dashboard.pluggy.ai](https://dashboard.pluggy.ai).
3. Nas configurações da sua aplicação, adicione o conector **MeuPluggy** à lista de conectores.
4. Em **Applications**, crie uma aplicação de desenvolvimento e copie o **Client ID** e o **Client Secret**.
5. Abra a aplicação, clique em **Ir para Demo** e autorize o MeuPluggy. Repita para cada banco.
6. Ainda no Demo, no menu de três pontos no canto superior direito, use **Copiar Item ID**. Guarde um Item ID por banco.

**2. No `.env`: informe as credenciais**

```dotenv
PLUGGY_CLIENT_ID="..."
PLUGGY_CLIENT_SECRET="..."
```

Reinicie o app e, fora do launcher e do Docker, rode `npm run db:migrate`. Os Item
IDs não vão no `.env`: eles são cadastrados na próxima etapa.

**3. No app: em Configurações > Open Finance**

1. Crie antes as contas locais em que os dados vão entrar. O cartão precisa ser uma conta de crédito com dia de fechamento.
2. Em **Adicionar banco**, informe um nome e o Item ID de cada banco.
3. Vincule cada conta do banco a uma conta local e defina a data de corte, o primeiro dia importado.
4. Informe seu nome completo, seu CPF e, se quiser, uma conta em **Outras contas próprias**. Sem isso, transferências entre as suas contas contam como receita e despesa.
5. Em **Investimentos**, vincule cada posição a um ativo ou crie um novo.
6. Clique em **Sincronizar bancos**.
7. Escolha as categorias em **Pendências de categoria**. O app aprende e aplica nas próximas importações.

O botão lê o que a Pluggy já coletou, e o MeuPluggy atualiza os dados uma vez por
dia. Se você já tem lançamentos manuais no período, faça a
[migração do histórico](docs/open-finance.md#migração-do-histórico-cutover) antes
de sincronizar, para não duplicar dados.

## Documentação

| Assunto | Documento |
|---|---|
| Funcionalidades | [docs/features.md](docs/features.md) |
| Regras do Open Finance | [docs/open-finance.md](docs/open-finance.md) |
| Sessão local e PIN | [docs/sessao-e-pin.md](docs/sessao-e-pin.md) |
| Privacidade dos dados | [docs/FINANCIAL-PRIVACY.md](docs/FINANCIAL-PRIVACY.md) |
| Réplica local do Turso | [docs/turso-replica.md](docs/turso-replica.md) |
| Integração MCP | [docs/mcp.md](docs/mcp.md) |
| Exportação de relatórios | [docs/reports-csv.md](docs/reports-csv.md) |
| Quality gate e baselines | [docs/workflow-baselines.md](docs/workflow-baselines.md) |
