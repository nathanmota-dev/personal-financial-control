# Personal Financial Control

Sistema web de finanças pessoais para organizar contas, receitas, despesas,
transferências, cartões de crédito, investimentos e metas. O painel reúne o
saldo, os gastos por categoria e as projeções financeiras.

## Configuração inicial

Na raiz do projeto, copie o arquivo de exemplo:

```bash
cp .example.env .env
```

Para usar o sistema com seus dados, preencha no `.env`:

- `DATA_ENCRYPTION_KEY`: chave base64 de 32 bytes para proteger os dados financeiros;
- as variáveis Firebase Web e Admin: credenciais do mesmo projeto Firebase;
- `APP_URL`: endereço usado pelo Docker e pelo app instalado no Linux;
- `APP_URL_DEVELOPMENT`: endereço usado pelo servidor de desenvolvimento.

Você pode gerar a chave de criptografia com:

```bash
openssl rand -base64 32
```

Guarde essa chave e mantenha o mesmo valor enquanto usar o banco. Trocá-la impede
a leitura dos dados já criptografados. Não versione o `.env`.

No Firebase Authentication, habilite o login Google e autorize os domínios
`localhost`, `127.0.0.1` e o domínio de produção, se houver. Após aplicar as
migrações, cadastre no banco os e-mails permitidos na tabela `authorized_users`.
O sistema não oferece cadastro público.

Para experimentar sem configurar banco ou Firebase, defina `DEMO_MODE=true` e
clique em **Explorar demo** na tela de login. Os dados são simulados e as
alterações são temporárias.

## Instalar com Docker

Requisitos: Docker e Docker Compose.

Com o `.env` configurado, execute:

```bash
docker compose up -d --build
```

Acesse <http://127.0.0.1:3007>. O container cria o banco SQLite e aplica as
migrações automaticamente. Os dados ficam no volume
`personal_financial_control_data`.

Para parar o sistema:

```bash
docker compose down
```

Os dados são preservados. Usar `docker compose down -v` também remove o banco.

## Instalar como aplicativo no Linux

Requisitos: Node.js 24, npm e um navegador baseado em Chromium.
Configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no `.env` para usar o Turso.

Na raiz do projeto, execute:

```bash
chmod +x ./*.sh
./install-app.sh
```

Abra **Finance** no menu de aplicativos. O primeiro início instala as
dependências, prepara o build e aplica as migrações. O servidor é encerrado ao
fechar a janela.

Para abrir diretamente pelo terminal:

```bash
./open-app.sh
```

O navegador padrão é o Google Chrome. Para usar Chromium, altere
`BROWSER_BIN="chromium"` no `.env`. Se mover o projeto para outra pasta,
execute `./install-app.sh` novamente.

## Executar em desenvolvimento

Requisitos: Node.js 24 e npm. Configure o `.env`, incluindo as credenciais do
Turso, e execute:

```bash
npm ci
npm run db:migrate
npm run dev
```

Acesse <http://localhost:3000>, conforme `APP_URL_DEVELOPMENT`. No modo demo,
as migrações e a configuração do Turso não são necessárias.

## Cotações de investimentos

Para habilitar a atualização automática de cotações, preencha `BRAPI_API_TOKEN`
no `.env`. Sem o token, você pode informar as cotações manualmente.
