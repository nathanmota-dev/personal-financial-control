# Análise de integração com Open Finance

> Análise feita em 20/06/2026 com base no estado atual deste repositório e nas ofertas públicas dos provedores nessa data.

## Resumo executivo

A integração é tecnicamente viável e combina bem com a arquitetura atual. Para o objetivo específico deste projeto — uso pessoal, uma única instituição e consulta de saldo bancário, cartão e investimentos — a melhor primeira opção é o **Meu Pluggy / Data Passport**, e não o plano empresarial normal da Pluggy.

O Meu Pluggy anuncia cadastro gratuito, conexão das próprias contas e acesso aos próprios dados pela API da Pluggy. O guia oficial informa que cada conexão pode fornecer contas, saldos, transações, investimentos e identidade, que a sincronização ocorre diariamente e que as credenciais da aplicação demo podem ser trocadas por uma API key. Isso corresponde diretamente ao caso de uso deste app.

Há, porém, três ressalvas importantes:

1. A página pública não informa cotas, SLA ou garantia de permanência da gratuidade. Para um app pessoal isso é aceitável, mas a integração deve ser desacoplada para permitir troca de provedor.
2. Cobertura varia por instituição e produto. É necessário validar com a instituição real se conta, cartão, fatura e investimentos são todos retornados antes de alterar o banco local.
3. Uma integração apenas de leitura de saldos é relativamente simples; sincronizar transações, faturas e posições de investimento de forma idempotente é consideravelmente mais difícil.

Recomendação: começar com um **MVP somente leitura**, exibindo os saldos externos separadamente dos saldos calculados pelo app. Não importar transações automaticamente na primeira versão.

## Veredito de dificuldade

Estimativa para uma pessoa desenvolvedora familiarizada com Next.js, TypeScript, Drizzle e APIs REST:

| Escopo | Dificuldade | Estimativa | Resultado |
| --- | --- | --- | --- |
| Spike sem alterar o app | Baixa, 2/10 | 2–4 horas | Validar credenciais, instituição e payloads reais com `curl` ou Postman |
| MVP somente leitura | Média, 4/10 | 2–4 dias | Saldo da conta, saldo/fatura aberta do cartão, total de investimentos e data da última atualização |
| Integração pessoal bem acabada | Média, 6/10 | 5–10 dias úteis | Persistência de snapshots, botão de sincronização, erros, reconexão, histórico e testes |
| Sincronização contábil robusta | Média-alta, 8/10 | 3–5 semanas | Importação automática de lançamentos, faturas, parcelas e ativos sem duplicação nem conflito com dados manuais |

O ganho mais importante pode ser entregue no segundo nível. O último nível só compensa se o objetivo passar de “ver saldos facilmente” para “substituir lançamentos manuais pelos dados do banco”.

## O que existe hoje no projeto

### Arquitetura

O app usa:

- Next.js 16 com páginas server-side;
- Server Actions em `app/actions/finance.ts` para mutações;
- serviços de domínio em `lib/server/*`;
- Drizzle com SQLite local ou Turso;
- Zod para validação;
- valores monetários persistidos como inteiros em centavos.

Essa separação é adequada para a integração. O cliente da Pluggy deve ficar em uma nova camada server-side, e as telas devem continuar consumindo funções internas em vez de conhecer o formato do provedor.

### Rotas HTTP atuais

Existe uma única rota HTTP:

- `POST /api/import/financial-json`, implementada em `app/api/import/financial-json/route.ts`.

Ela importa um JSON mensal agrupado em entradas, gastos fixos, gastos variáveis e investimentos. A rota cria conta e categorias quando necessário e tenta evitar duplicidade comparando conta, categoria, tipo, valor, data, competência e descrição.

O README está desatualizado nesse ponto: ele afirma que não existem rotas em `app/api`, mas a rota de importação existe.

Essa rota **não deve ser reaproveitada** para Open Finance porque:

- o payload é um resumo manual, não o modelo de contas e transações de um provedor;
- a deduplicação por campos semelhantes pode descartar duas compras legítimas iguais;
- não existe `externalId` para fazer `upsert` determinístico;
- não há controle de cursor, execução de sincronização ou estado da conexão;
- erros são sempre devolvidos como `400`, sem distinguir falha de validação, provedor indisponível ou erro interno;
- não há autenticação da rota. Isso é tolerável se o app estiver estritamente local, mas não se ele for publicado.

### Modelo de dados atual

O modelo atual atende bem ao controle manual, mas não representa integralmente dados externos:

| Área | Estado atual | Lacuna para Open Finance |
| --- | --- | --- |
| Contas | `accounts` e saldo calculado a partir do saldo inicial e lançamentos | Falta vínculo com provedor, saldo informado pelo banco, data de referência e histórico de snapshots |
| Transações | Tipos `income`, `expense` e `investment_contribution` | Faltam ID externo, origem, status externo, hash/cursor de sincronização, estornos e reconciliação |
| Cartão | Compras e parcelas manuais em `credit_card_charges` e `credit_card_installments` | O provedor pode retornar cartão, transações, parcelas e faturas em momentos diferentes; o modelo não guarda `billId` externo nem snapshots da fatura |
| Investimentos | Uma linha consolidada em `investment_portfolio` | O provedor retorna posições individuais, tipos, códigos, quantidade, valor e data; o modelo atual guarda apenas saldo total e parâmetros de projeção |
| Conexão | Inexistente | Faltam `itemId`, estado, consentimento, último sync, erro e execução |

O principal risco é o saldo. Hoje `currentBalanceCents` é calculado localmente. Se o saldo bancário for colocado em `initialBalanceCents` e as transações também forem importadas, haverá dupla contagem ou divergências. O saldo externo precisa ser armazenado como **snapshot separado**, com sua própria data de referência.

## O que a API pode fornecer

No modelo da Pluggy, uma conexão é um `Item`. Um único `Item` pode devolver várias contas: por exemplo, conta corrente e cartão de crédito. Portanto, “uma conta no banco” não significa necessariamente um único registro na API.

Para este app, os recursos relevantes são:

| Necessidade | Recurso da Pluggy | Observação |
| --- | --- | --- |
| Saldo bancário | `GET /accounts?itemId=...` | Para conta bancária, `balance` representa o saldo disponível atual |
| Cartão | Contas do tipo `CREDIT` e transações da conta | Para cartão, `balance` representa o saldo da fatura aberta ainda não paga |
| Faturas | endpoints de `bills` | Faturas abertas podem não aparecer até o fechamento ou vencimento, dependendo da instituição |
| Investimentos | endpoints de `investments` | Retornam posições individuais; cobertura e campos variam por instituição e tipo de ativo |
| Transações | endpoint paginado de transações | A carga inicial pode trazer histórico; sincronizações posteriores podem alterar registros pendentes |
| Atualização | sincronização diária do `Item` | O app ainda precisa buscar e persistir os novos dados ou consultar a API ao abrir a página |

Cartão é a parte mais sujeita a diferenças entre instituições. Compras parceladas podem aparecer apenas com a primeira parcela, com parcelas futuras pendentes ou apenas quando a fatura fechar. Por isso, o total retornado pelo provedor deve ser mostrado como dado bancário, sem tentar reconstruir imediatamente a mesma estrutura manual usada hoje pelo app.

## Gratuidade e escolha do provedor

### Opção recomendada: Meu Pluggy / Data Passport

O produto é apresentado como um passaporte pessoal de dados:

- cadastro gratuito;
- conexão de uma ou mais contas próprias;
- acesso por API, MCP e CLI;
- saldos, transações, cartões, investimentos e identidade;
- mais de 50 instituições anunciadas;
- sincronização automática diária;
- uso de `Client ID` e `Client Secret` da aplicação demo para gerar uma API key.

O fluxo documentado é:

1. criar a conta gratuita no Meu Pluggy;
2. conectar a instituição e conceder o consentimento;
3. abrir o Dashboard Pluggy e vincular os itens do Meu Pluggy à aplicação demo;
4. obter `Client ID`, `Client Secret` e `Item ID`;
5. no servidor, chamar `POST https://api.pluggy.ai/auth`;
6. usar a API key temporária no header `X-API-KEY`.

A API key não é uma chave permanente. A documentação geral da Pluggy informa validade de duas horas; o servidor deve gerá-la com `Client ID` e `Client Secret`, mantê-la apenas em memória e renová-la quando necessário. Esses segredos nunca devem chegar a um componente client-side.

#### Limite da conclusão sobre custo

As páginas verificadas dizem “criar conta gratuita”, mas não publicam cota de requisições, SLA, termos específicos da API pessoal ou garantia de gratuidade futura. Assim, a conclusão correta é:

> Hoje existe um caminho oficial aparentemente gratuito e adequado para consultar os próprios dados. Ele deve ser tratado como uma facilidade pessoal/best effort, não como um contrato de produção.

Antes de escrever código, vale fazer o spike e confirmar que a aplicação demo realmente consegue consultar o `Item` conectado sem expiração de trial.

### Pluggy API empresarial

Não é gratuita de forma permanente. A página de preços consultada oferece:

- trial grátis por 14 dias;
- até 20 contas conectadas no trial;
- plano básico a partir de R$ 2.500/mês.

Além disso, a documentação comercial classifica conectores Open Finance regulados como recurso premium. Essa oferta não é adequada ao orçamento de um app pessoal. O Data Passport é um caso especial porque expõe os **próprios dados** por proxy, e não deve ser confundido com permissão para oferecer agregação financeira a usuários de um produto.

### Belvo

A Belvo também não resolve o requisito de produção gratuita. A página oficial informa sandbox gratuito apenas para testes e exige plano pago para acessar dados reais; o plano de lançamento anunciado é de USD 1.000/mês.

### Integração direta com os bancos

“Open Finance” não equivale a uma API pública em que uma pessoa física cria uma key e consulta qualquer banco diretamente. Na prática, participar diretamente do ecossistema regulado envolve requisitos de participante, certificados, diretório, segurança, consentimento e conformidade. Para este projeto pessoal, um agregador/proxy como o Meu Pluggy é a alternativa proporcional.

## Arquitetura recomendada

### Primeira versão: leitura isolada

```text
Meu Pluggy / instituição
          |
          v
lib/open-finance/pluggy-client.ts
          |
          v
lib/server/open-finance.ts
          |
          +---- contas e saldos externos
          +---- cartão/fatura externa
          +---- total de investimentos
          |
          v
dashboard e telas existentes
```

Princípios:

- toda comunicação com o provedor ocorre no servidor;
- Zod valida todas as respostas externas antes de persistir ou renderizar;
- valores da Pluggy são normalizados para centavos apenas depois de confirmar a unidade de cada campo;
- saldo externo e saldo calculado localmente aparecem como valores diferentes;
- a camada de domínio recebe um modelo normalizado, não tipos da Pluggy;
- o provedor fica atrás de uma interface para permitir substituição futura.

Arquivos sugeridos:

```text
lib/open-finance/provider.ts
lib/open-finance/pluggy-client.ts
lib/open-finance/pluggy-schemas.ts
lib/open-finance/normalizers.ts
lib/server/open-finance.ts
```

Não é necessário adicionar um SDK no primeiro momento. Para poucos endpoints, `fetch` nativo, timeout explícito, Zod e tratamento de erro dão uma integração menor e mais controlável.

### Variáveis de ambiente

Adicionar ao schema de `lib/env.ts`, mantendo tudo apenas no servidor:

```text
PLUGGY_CLIENT_ID
PLUGGY_CLIENT_SECRET
PLUGGY_ITEM_ID
```

Não persistir a API key de duas horas no banco nem em variável pública. Não adicionar nenhum segredo com prefixo `NEXT_PUBLIC_`.

### Persistência mínima recomendada

Mesmo no MVP, é útil manter histórico e estado de erro:

```text
open_finance_connections
  id
  provider
  external_item_id (unique)
  status
  consent_expires_at
  last_synced_at
  last_error_code
  last_error_message

open_finance_accounts
  id
  connection_id
  external_account_id
  local_account_id (nullable)
  type
  subtype
  name
  currency_code
  last_four_digits
  unique(provider, external_account_id)

open_finance_balance_snapshots
  id
  external_account_id
  available_balance_cents
  credit_limit_cents (nullable)
  reference_at
  unique(external_account_id, reference_at)

open_finance_investment_snapshots
  id
  connection_id
  external_investment_id
  type
  subtype
  name
  code
  quantity_decimal
  gross_value_cents
  net_value_cents
  reference_date
  unique(external_investment_id, reference_date)
```

Para quantidades de ativos, não usar centavos nem `number` de ponto flutuante sem regra explícita. SQLite pode guardar decimal como texto normalizado para evitar perda de precisão.

### Sincronização

Para um app local, a solução mais simples e robusta é:

1. Pluggy sincroniza o `Item` diariamente;
2. o app oferece um botão “Atualizar dados bancários”;
3. a Server Action consulta os recursos atuais e faz `upsert` dos snapshots;
4. a interface mostra “última atualização” e eventual erro de consentimento.

Um webhook só deve entrar depois. A Pluggy exige URL HTTPS válida, e o app hoje sobe localmente na porta 3007; portanto ele não consegue receber webhook sem ser publicado ou exposto por túnel. Para uso pessoal, isso adiciona infraestrutura sem benefício proporcional.

Se no futuro o app for hospedado, podem ser criadas:

- `POST /api/open-finance/webhooks/pluggy` para notificações;
- `POST /api/open-finance/sync` apenas se houver consumidor HTTP externo.

Para o botão dentro do próprio app, uma Server Action é suficiente e mantém o padrão atual.

## Como tratar cada domínio

### Contas e saldo

Não substituir `initialBalanceCents`. Adicionar e mostrar:

- saldo calculado pelo app;
- saldo informado pela instituição;
- diferença entre os dois;
- data/hora do dado externo.

Essa diferença se torna uma ferramenta de conciliação sem mudar as regras atuais.

### Cartão

Na primeira versão, mostrar diretamente:

- saldo da fatura aberta;
- limite total e disponível, quando fornecidos;
- vencimento e fechamento, quando fornecidos;
- última sincronização.

Não gerar automaticamente `credit_card_charges` e parcelas com base nesses dados. A documentação do provedor registra diferenças importantes entre instituições, especialmente para faturas abertas e compras parceladas.

### Investimentos

No MVP, somar o valor atual das posições e usar esse total como “saldo externo da carteira”, sem sobrescrever automaticamente `investment_portfolio.currentBalanceCents`.

Depois, uma ação explícita pode permitir “usar saldo externo como novo checkpoint”. Isso preserva o comportamento atual de projeções e evita que uma sincronização diária altere silenciosamente um cálculo planejado pelo usuário.

### Transações

É a última etapa, porque exige as decisões mais difíceis:

- mapear categorias externas para grupos internos;
- distinguir transferência própria de receita/despesa;
- atualizar `PENDING` para `POSTED` sem duplicar;
- tratar estorno e cancelamento;
- decidir se edições manuais sobrevivem a uma nova sincronização;
- garantir `upsert` por ID externo;
- lidar com descrições, datas e valores corrigidos pelo banco.

Se essa etapa for implementada, `transactions` precisa de pelo menos:

```text
source: manual | import_json | open_finance
external_provider
external_id
external_account_id
external_status
synced_at
```

E de um índice único parcial/equivalente sobre provedor e ID externo. A deduplicação atual por conteúdo não é segura para dados bancários.

## Segurança e privacidade

- Nunca armazenar senha bancária no app. A autorização deve ocorrer no fluxo hospedado pelo Meu Pluggy/Pluggy.
- Guardar `Client Secret` apenas em `.env.local` ou secret manager.
- Gerar API key somente no servidor e renovar após expiração.
- Aplicar timeout e limite de tentativas; não repetir indefinidamente chamadas com erro.
- Não registrar payloads completos, CPF, número de conta, tokens ou headers de autenticação em logs.
- Persistir apenas os campos necessários. Evitar guardar o JSON bruto por padrão.
- Se usar Turso, lembrar que os dados financeiros deixam o arquivo SQLite local e passam a ser armazenados em serviço externo.
- Se o app for publicado, adicionar autenticação ao app e proteger também `/api/import/financial-json`.
- Tratar consentimento revogado/expirado como estado normal que pede reconexão, não como erro interno.

## Plano de implementação sugerido

### Fase 0 — validação sem código

- criar a conta no Meu Pluggy;
- conectar a instituição real;
- vincular o item à aplicação demo;
- gerar API key;
- testar contas, transações e investimentos;
- registrar quais produtos vieram completos e quais não vieram.

Critério de saída: conseguir obter pelo menos saldo bancário, cartão e total de investimentos. Se algum produto não estiver disponível, não iniciar migrações antes de avaliar outro conector.

### Fase 1 — cliente e visualização somente leitura

- validar novas variáveis de ambiente;
- implementar autenticação com cache da API key;
- implementar cliente com timeout e schemas Zod;
- normalizar contas, cartão e investimentos;
- mostrar dados externos e última atualização nas telas existentes;
- criar testes com fixtures, sem chamar a API real na suíte.

### Fase 2 — snapshots e conciliação

- criar tabelas de conexão, contas externas e snapshots;
- fazer sincronização idempotente;
- adicionar botão de atualização;
- mostrar diferença entre saldo externo e saldo local;
- tratar consentimento revogado, indisponibilidade e resposta parcial.

### Fase 3 — importação opcional de transações

- adicionar IDs externos e origem aos lançamentos;
- criar regras de categorização e transferências;
- definir precedência entre dado bancário e edição manual;
- cobrir atualização de pendente, estorno, duplicidade e paginação em testes.

### Fase 4 — webhook, apenas se o app for hospedado

- criar endpoint HTTPS;
- validar a autenticidade conforme o mecanismo suportado pelo provedor;
- enfileirar ou serializar sincronizações;
- tornar o processamento idempotente;
- monitorar falhas e repetições.

## Critérios de robustez

A integração pode ser considerada robusta quando:

- uma sincronização repetida não cria duplicados;
- falha parcial não apaga o último dado válido;
- cada saldo exibe sua data de referência;
- segredos nunca aparecem no browser ou nos logs;
- consentimento revogado produz uma orientação de reconexão;
- dados manuais não são sobrescritos silenciosamente;
- valores externos são validados antes de chegar ao banco;
- o app continua funcionando quando a Pluggy estiver indisponível;
- a implementação é testada com conta, cartão, parcelas, investimento, paginação, erro e resposta parcial;
- o provedor pode ser trocado sem reescrever as páginas.

## Recomendação final

Vale implementar, com escopo controlado. Para o objetivo informado, a melhor relação custo/benefício é:

1. usar Meu Pluggy/Data Passport;
2. validar gratuitamente os dados reais da instituição;
3. entregar apenas saldos de conta, cartão e investimentos;
4. manter esses saldos separados da contabilidade local;
5. adicionar importação automática de transações somente depois que a leitura estiver estável.

Com esse recorte, a dificuldade é **média** e não exige mudar a base do app. Tentar começar por sincronização completa e automática elevaria o risco principalmente por reconciliação, cartão parcelado e diferenças entre o saldo bancário e o ledger local.

## Fontes consultadas

Fontes acessadas em 20/06/2026:

- [Meu Pluggy / Data Passport](https://my.pluggy.ai/)
- [Guia da API do Meu Pluggy](https://my.pluggy.ai/api-guide)
- [Preços da Pluggy](https://pluggy.ai/pricing)
- [Autenticação da Pluggy](https://docs.pluggy.ai/docs/authentication)
- [Contas e cartão no modelo Pluggy](https://docs.pluggy.ai/docs/accounts)
- [Faturas de cartão](https://docs.pluggy.ai/docs/credit-card-bills)
- [Investimentos](https://docs.pluggy.ai/docs/investments)
- [Conectores Open Finance e cobertura](https://docs.pluggy.ai/docs/open-finance-regulated)
- [Diferenças e limitações do Open Finance regulado](https://docs.pluggy.ai/docs/considerations-faq)
- [Sincronização de dados](https://docs.pluggy.ai/docs/data-sync-update-an-item)
- [Consentimento e revogação](https://docs.pluggy.ai/docs/consents)
- [Webhooks](https://docs.pluggy.ai/docs/webhooks)
- [Planos da Belvo](https://belvo.com/plans-and-pricing/)
- [Open Finance no Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/openfinance)
