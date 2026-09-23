  # Plano enxuto para o módulo de investimentos

> Documento de planejamento. O objetivo é evoluir somente a área de investimentos do Personal Financial Control, sem tentar reproduzir todas as funcionalidades de plataformas como Investidor10.

## 1. Objetivo

Criar uma carteira de investimentos pessoal que permita:

- separar claramente **reserva** de **investimentos**;
- registrar compras e vendas de ações e FIIs negociados na B3;
- registrar aplicações e resgates de renda fixa;
- atualizar sob demanda a cotação de referência dos ativos listados;
- calcular posição, preço médio, custo, valor atual e ganho ou perda;
- acompanhar a evolução e a distribuição da carteira por classe de ativo.

O primeiro produto deve responder a quatro perguntas:

1. Quanto tenho na reserva e quanto tenho investido?
2. Quais ativos possuo e em que quantidade?
3. Quanto investi em cada ativo?
4. Quanto cada posição ganhou ou perdeu até agora?

### Regra central do produto

O preço pago pelo usuário e a cotação externa são dados diferentes e nunca devem ser confundidos:

- ao registrar uma compra, o usuário informa a quantidade e o preço unitário que efetivamente pagou;
- o app não tenta descobrir, validar ou substituir esse preço pela cotação do mesmo dia;
- taxas opcionais podem ser somadas ao custo da operação;
- ao atualizar a carteira, a API fornece apenas uma nova cotação de referência;
- essa cotação é multiplicada pela quantidade atual para estimar o valor de mercado;
- a diferença entre o custo da posição e o valor de mercado mostra a evolução da carteira.

Exemplo: mesmo que a cotação observada de uma ação seja R$ 15,20, uma compra pode ser registrada a R$ 15,00 ou R$ 15,60. O cálculo sempre usa o preço efetivamente informado na operação.

## 2. Escopo do MVP

### Classes suportadas

| Classe | Exemplos | Atualização do valor |
| --- | --- | --- |
| Ações brasileiras | `PETR4`, `VALE3`, `ITUB4` | Cotação externa da B3 por provedor |
| FIIs | `MXRF11`, `HGLG11`, `KNRI11` | Cotação externa da B3 por provedor |
| ETFs | `BOVA11`, `IVVB11`, `SMAL11` | Cotação externa da B3 por provedor |
| Tesouro Direto | Tesouro Selic, Prefixado e IPCA+ | Saldo manual no MVP |
| Renda fixa bancária | CDB, LCI e LCA | Valor atual manual no MVP; cálculo automático pode vir depois |

FIIs e fundos imobiliários são a mesma classe neste documento. Fundos de investimento tradicionais não entram no primeiro MVP porque normalmente não possuem ticker negociado em bolsa e sua cota depende de dados da administradora ou instituição.

### Operações suportadas

- compra;
- venda;
- aplicação em renda fixa;
- resgate de renda fixa;
- correção manual de posição;
- arquivamento de ativo encerrado;
- atualização de cotações quando o usuário solicitar;
- registro de um ponto histórico da carteira após cada atualização bem-sucedida.

### Indicadores do MVP

- quantidade atual;
- preço médio de aquisição;
- custo total atual;
- cotação mais recente;
- data e hora da cotação;
- valor de mercado da posição;
- ganho ou perda não realizado em reais;
- rentabilidade não realizada em percentual;
- participação do ativo na carteira;
- total da reserva;
- total investido;
- patrimônio financeiro total: reserva + investimentos;
- evolução histórica do custo acumulado e do valor de mercado da carteira.

### Fora do MVP

Para manter a primeira versão pequena, não implementar inicialmente:

- recomendação de compra ou venda;
- imposto de renda, DARF ou preço médio fiscal completo;
- dividendos, juros sobre capital próprio e rendimentos de FIIs;
- desdobramentos, grupamentos, bonificações, subscrições e demais eventos corporativos;
- notas de corretagem;
- importação automática da corretora ou B3;
- ativos internacionais, criptomoedas, opções e contratos futuros;
- análise fundamentalista, rankings ou comparação de empresas;
- rentabilidade por TWR/XIRR;
- marcação a mercado precisa de CDB, LCI e LCA.

Esses itens exigem modelos contábeis e fontes de dados adicionais. Misturá-los ao primeiro MVP aumentaria muito o risco de apresentar rentabilidade errada.

## 3. Separação entre reserva e investimentos

O app já possui contas, metas, caixinhas/finalidades e posições de investimento. A evolução deve evitar manter dois saldos concorrentes para o mesmo dinheiro.

### Modelo recomendado

- **Reserva** é um propósito financeiro, não uma classe de ativo.
- **Ativo** representa onde o dinheiro está aplicado: Tesouro Selic, CDB, ação, FII etc.
- **Objetivo** representa para que o dinheiro existe: reserva de emergência, aposentadoria, compra de imóvel etc.
- Um ativo de reserva deve estar 100% associado ao objetivo `Reserva de emergência`.

Exemplo:

```text
Patrimônio financeiro: R$ 35.000
├── Reserva: R$ 15.000
│   ├── Tesouro Selic 2029: R$ 10.000
│   └── CDB liquidez diária: R$ 5.000
└── Investimentos: R$ 20.000
    ├── Ações: R$ 12.000
    └── FIIs: R$ 8.000
```

Essa abordagem reaproveita `investment_purposes` e `investment_purpose_allocations`, já existentes, em vez de criar uma segunda carteira exclusiva para a reserva.

Na interface, entretanto, a separação deve ser explícita:

- card **Reserva**;
- card **Investimentos**;
- card **Patrimônio total**;
- filtro para mostrar reserva, investimentos ou tudo;
- ativo marcado como reserva aparece na composição e conciliação da reserva, mas nunca na carteira ou distribuição de longo prazo;
- o saldo projetado do checkpoint, aportes, retiradas e rendimento é o saldo oficial da reserva; os ativos associados explicam sua composição e não são somados novamente.

## 4. Limitação do modelo atual

Hoje `investment_holdings` guarda principalmente:

- nome e ticker;
- instituição;
- classe e tipo do instrumento;
- valor atual informado manualmente;
- data desse valor.

Isso é suficiente para uma fotografia da carteira, mas não para calcular preço médio ou ganho/perda. Falta registrar o histórico de operações e as cotações usadas na avaliação.

A mudança central é esta:

```text
modelo atual: ativo -> valor atual manual
modelo novo:  ativo -> operações -> quantidade e custo
                         + cotação -> valor atual e resultado
```

O histórico de operações deve ser a fonte de verdade para quantidade e custo. `currentValueCents` não deve continuar sendo editado manualmente para ativos listados.

## 5. Modelo de dados proposto

### 5.1 Evoluir `investment_holdings`

Manter a tabela e acrescentar campos:

| Campo | Tipo sugerido | Finalidade |
| --- | --- | --- |
| `valuationMode` | `market_quote`, `manual_balance`, `contract_estimate` | Define como o valor atual é obtido |
| `currency` | texto, padrão `BRL` | Prepara o modelo para moedas sem ampliar o MVP |
| `quoteSymbol` | texto opcional | Símbolo esperado pelo provedor, normalmente igual ao ticker |
| `externalProvider` | texto opcional | Provedor da cotação atual |
| `externalAssetId` | texto opcional | Identificador estável do ativo no provedor, quando existir |
| `isEmergencyReserve` | booleano, opcional | Atalho visual; a alocação por propósito continua sendo a relação principal |

Para evitar duas fontes de verdade, o campo `currentValueCents` atual deverá ser tratado assim:

- ativos com `manual_balance`: continua sendo o saldo informado pelo usuário;
- ativos com `market_quote`: passa a ser derivado da posição e última cotação, ou mantido apenas temporariamente durante a migração;
- remoção física do campo somente em uma etapa futura, depois da migração e estabilização.

### 5.2 Nova tabela `investment_operations`

```text
investment_operations
  id
  holding_id                 FK -> investment_holdings
  type                       buy | sell | application | redemption | correction
  trade_date                 YYYY-MM-DD
  settlement_date            YYYY-MM-DD opcional
  quantity_scaled            inteiro
  quantity_scale             inteiro, padrão 8
  unit_price_cents            inteiro criptografado
  gross_amount_cents          inteiro criptografado
  fees_cents                  inteiro criptografado, padrão 0
  notes                       texto opcional
  created_at
  updated_at
```

Não usar `REAL` para quantidade ou preço. Quantidades fracionárias devem ser armazenadas como inteiro escalado. Por exemplo, com escala 8, `1,5` unidade vira `150000000`.

Regras:

- `buy` e `application` aumentam posição;
- `sell` e `redemption` reduzem posição;
- não permitir venda superior à quantidade disponível;
- alteração ou exclusão de uma operação recalcula toda a posição do ativo;
- taxas de compra entram no custo; taxas de venda reduzem o valor líquido recebido;
- correções devem exigir uma observação.

### 5.3 Nova tabela `investment_quotes`

```text
investment_quotes
  id
  holding_id                 FK -> investment_holdings
  provider
  symbol
  price_cents                inteiro criptografado
  quoted_at                  timestamp informado pelo provedor
  fetched_at                 timestamp da consulta
  market_state               open | closed | delayed | unknown
  is_stale                   boolean
  raw_currency               texto
  unique(provider, symbol, quoted_at)
```

Não é necessário salvar cada atualização intradiária. Para o MVP:

- guardar somente a última cotação por ativo; ou
- guardar no máximo uma cotação por dia, se já for desejável montar um gráfico simples de patrimônio.

A segunda opção custa pouco no Turso e permite reconstruir parte da evolução diária dos ativos.

### 5.4 Nova tabela `investment_portfolio_snapshots`

Como o foco é visualizar a evolução da carteira, cada atualização bem-sucedida deve consolidar um ponto histórico:

```text
investment_portfolio_snapshots
  id
  snapshot_date
  invested_cost_cents         custo das posições abertas
  market_value_cents          valor das posições pela última cotação
  reserve_value_cents
  investments_value_cents     valor fora da reserva
  unrealized_result_cents
  created_at
  unique(snapshot_date)
```

Se houver mais de uma atualização no mesmo dia, atualizar o snapshot daquele dia em vez de criar vários pontos. O gráfico do MVP pode então mostrar duas linhas:

- **Total investido:** custo acumulado das posições ainda abertas;
- **Valor da carteira:** valor dessas posições pelas cotações salvas.

A distância entre as linhas representa o ganho ou a perda não realizado. Aportes aumentam as duas linhas e não devem ser apresentados como rentabilidade.

### 5.5 Dados específicos de renda fixa

Adicionar uma tabela separada evita encher `investment_holdings` de campos que não se aplicam a ações:

```text
fixed_income_terms
  id
  holding_id                 unique FK -> investment_holdings
  subtype                    treasury | cdb | lci | lca
  issuer_name
  indexer                    selic | cdi | ipca | fixed
  rate_bps                   percentual contratado em basis points
  index_percentage_bps       ex.: 110% do CDI = 11000
  maturity_date
  liquidity                  daily | at_maturity
  invested_amount_cents
  current_balance_cents
  balance_as_of
```

No MVP, `current_balance_cents` é atualizado manualmente para CDB, LCI e LCA. Guardar os termos desde o início permite adicionar estimativa automática depois sem migrar os cadastros.

## 6. Cálculos

### Ações e FIIs

Para cada ativo:

```text
quantidade atual = compras - vendas
custo atual = custo das compras ainda mantidas
preço médio = custo atual / quantidade atual
valor atual = quantidade atual × última cotação
resultado não realizado = valor atual - custo atual
rentabilidade não realizada = resultado não realizado / custo atual × 100
```

O MVP pode usar **preço médio móvel** nas vendas:

1. antes da venda, calcular o preço médio atual;
2. reduzir do custo a quantidade vendida multiplicada por esse preço médio;
3. manter o preço médio das unidades restantes;
4. registrar separadamente o resultado realizado da venda, mesmo que ele ainda não apareça na primeira tela.

Exemplo:

```text
10 cotas compradas a R$ 100 = R$ 1.000
 5 cotas compradas a R$ 110 = R$   550

quantidade: 15
custo: R$ 1.550
preço médio: R$ 103,33
cotação atual: R$ 108
valor atual: R$ 1.620
ganho não realizado: R$ 70,00 (4,52%)
```

Valores exibidos podem ser arredondados para centavos, mas os cálculos intermediários devem manter precisão decimal suficiente. Recomenda-se uma biblioteca decimal, em vez de `number`, para preço médio e multiplicação por quantidades fracionárias.

### Renda fixa

Renda fixa não possui uma regra única de “cotação atual”:

- Tesouro Direto pode ter preço de mercado antes do vencimento;
- CDB, LCI e LCA dependem de indexador, percentual contratado, calendário, tributação e regras da instituição;
- o saldo exibido pela corretora pode não coincidir exatamente com uma estimativa local.

Por isso, o MVP deve mostrar para renda fixa:

- total aplicado;
- saldo atual informado pelo usuário;
- rentabilidade nominal desde a aplicação;
- data de vencimento;
- indexador e taxa contratada;
- data de referência do saldo.

Não chamar um valor estimado de “saldo exato”.

## 7. API externa de cotações

### Regra de custo

O módulo deve funcionar sem assinatura, licença paga ou período de teste. Se uma informação não estiver disponível de forma gratuita e estável, o MVP deve aceitá-la manualmente ou deixá-la fora do escopo.

Não utilizar como dependência:

- plano Startup ou Pro da brapi;
- Market Data contratado diretamente da B3;
- API que exija cartão ou vire paga após um período de teste;
- endpoint gratuito não documentado ou obtido por scraping;
- Yahoo Finance ou outro endpoint não oficial sem garantia de uso como API.

### Recomendação inicial: plano Gratuito da brapi

Para um app pessoal focado no mercado brasileiro, a brapi é o ponto de partida mais simples:

- API REST em JSON;
- consulta ações, FIIs, ETFs e BDRs por ticker;
- possui SDK TypeScript, embora `fetch` nativo seja suficiente para o MVP;
- oferece cotação básica para ações e FIIs no plano gratuito;
- informa 15.000 requisições gratuitas por mês, um ticker por chamada, histórico de até três meses e atraso aproximado de 30 minutos.

Exemplo de endpoint documentado:

```text
GET https://brapi.dev/api/quote/PETR4
Authorization: Bearer <token>
```

Como o plano gratuito aceita um ticker por requisição, a atualização da carteira deve consultar os ativos individualmente, com concorrência pequena e controlada. Para uma carteira pessoal atualizada sob demanda, 15.000 requisições mensais são suficientes: uma carteira com 20 ativos atualizada uma vez por dia útil consumiria cerca de 440 requisições por mês.

Fontes consultadas em setembro de 2026:

- [documentação e exemplos da brapi](https://brapi.dev/docs/examples);
- [limites do plano gratuito da brapi](https://brapi.dev/faq/api-e-gratis-mesmo);
- [documentação de FIIs da brapi](https://brapi.dev/docs/fiis);
- [FAQ de Market Data da B3](https://www.b3.com.br/main.jsp?doui_processActionId=setLocaleProcessAction&locale=pt_BR&lumA=1&lumII=8AE690F77A1A49BA017A5839967B5BFE&lumPageId=8AE690F77A1A49BA017A5835830128C3).

Os endpoints detalhados de FIIs e Tesouro da brapi são pagos e, portanto, não fazem parte deste plano. Para FIIs, usar somente a cotação básica do ticker. Para Tesouro, CDB, LCI e LCA, o usuário informa o saldo atual.

### Atualização da carteira

O app não precisa de streaming nem de acompanhamento intradiário. Quando o usuário clicar em `Atualizar carteira`, o servidor busca a cotação mais recente disponível no plano gratuito e registra quando ela foi obtida. Atualmente, a brapi informa atraso aproximado de 30 minutos nesse plano. Dados mais rápidos da B3 envolvem outros planos ou regras comerciais e não entram no escopo.

Para a finalidade do app — acompanhar a evolução patrimonial, não negociar — são suficientes:

- última cotação disponível;
- cotação atrasada em alguns minutos; ou
- preço de fechamento do último pregão.

A interface deve sempre exibir `Atualizado em <data/hora>` e avisar quando estiver usando a última cotação salva.

### Arquitetura desacoplada do provedor

Não espalhar campos da brapi pelo domínio. Criar um contrato interno:

```ts
type MarketQuote = {
  symbol: string;
  priceCents: number;
  currency: "BRL";
  quotedAt: string;
  marketState: "open" | "closed" | "delayed" | "unknown";
  provider: string;
};

interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
}
```

Arquivos sugeridos:

```text
lib/market-data/contracts.ts
lib/market-data/brapi-client.ts
lib/market-data/brapi-schemas.ts
lib/market-data/normalizers.ts
lib/server/investment-quotes.ts
```

Todas as respostas externas devem ser validadas com Zod. O token deve existir somente no servidor:

```text
BRAPI_API_TOKEN
INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES=30
```

### Estratégia de atualização

Para o MVP, não é necessário cron, websocket nem atualização automática ao abrir a tela:

1. abrir a página e mostrar imediatamente os dados salvos no Turso;
2. o usuário clica em `Atualizar carteira`;
3. buscar cada ticker elegível separadamente, respeitando o limite gratuito de um ticker por chamada;
4. salvar as novas cotações;
5. recalcular as posições e salvar o snapshot diário da carteira;
6. atualizar a tela e mostrar o horário da atualização;
7. limitar a frequência do botão para proteger a cota da API.

Em caso de falha do provedor:

- continuar exibindo a última cotação válida;
- marcar o dado como desatualizado;
- não substituir o preço por zero;
- não impedir o acesso à carteira;
- registrar um erro técnico sem salvar token ou payload sensível.

## 8. Interface proposta

### Rotas

Manter a área atual e evoluí-la gradualmente:

```text
/investments                 resumo: reserva, investimentos e evolução
/investments/portfolio       posições detalhadas
/investments/assets/[id]     detalhe e operações de um ativo
```

Não é necessária uma rota separada para cada classe.

### `/investments`

Mostrar:

- patrimônio financeiro total;
- reserva;
- investimentos fora da reserva;
- custo total da carteira;
- ganho/perda total;
- distribuição por ações, FIIs e renda fixa;
- data da última atualização.
- gráfico de evolução com custo acumulado e valor da carteira.

### `/investments/portfolio`

Tabela principal:

| Ativo | Classe | Quantidade | Preço médio | Cotação | Valor atual | Ganho/perda | Participação |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| PETR4 | Ação | 20 | R$ 35,00 | R$ 38,00 | R$ 760,00 | +R$ 60,00 | 4,2% |
| MXRF11 | FII | 50 | R$ 9,80 | R$ 10,10 | R$ 505,00 | +R$ 15,00 | 2,8% |

Controles:

- filtro por reserva/investimentos/todos;
- filtro por classe;
- busca por nome ou ticker;
- botão para cadastrar ativo;
- botão para registrar operação;
- botão para atualizar cotações.

### Detalhe do ativo

Mostrar:

- resumo da posição;
- histórico de compras e vendas;
- formulário de nova operação;
- evolução do valor da posição com base nos snapshots disponíveis;
- instituição e finalidade;
- informações específicas de renda fixa quando aplicável.

## 9. Integração com os lançamentos financeiros

Na primeira versão, registrar uma compra não deve criar automaticamente outro lançamento financeiro. Isso evita duplicar aportes já registrados na tela de lançamentos.

Fluxo inicial:

- o usuário registra o aporte/transferência financeira como já faz hoje;
- registra a compra do ativo na carteira;
- os dois registros são independentes.

Depois da estabilização, pode ser criado um vínculo opcional:

```text
investment_operations.transaction_id -> transactions.id
```

Esse vínculo permitirá criar uma compra a partir de um aporte existente sem duplicar o impacto no saldo da conta.

## 10. Serviços e ações necessárias

Serviços de domínio:

```text
createInvestmentAsset
updateInvestmentAsset
createInvestmentOperation
updateInvestmentOperation
deleteInvestmentOperation
calculateInvestmentPosition
listInvestmentPositions
refreshInvestmentQuotes
getInvestmentAssetDetails
```

Regras importantes:

- operações, posição e custo devem ser recalculados no servidor;
- o cliente não envia ganho/perda calculado;
- ticker deve ser normalizado em maiúsculas;
- apenas ativos `market_quote` exigem ticker;
- cada `(provider, quoteSymbol)` ativo deve ser único;
- erros da API externa devem ser diferentes de erros de validação do usuário;
- mutações devem revalidar `/investments`, `/investments/portfolio` e o detalhe do ativo.

Uma rota HTTP é útil para atualização explícita:

```text
POST /api/investments/quotes/refresh
```

Ela deve executar somente no servidor, limitar frequência e nunca retornar o token do provedor.

## 11. Migração dos dados atuais

O módulo atual já pode conter ativos com valor manual. A migração não deve inventar quantidades ou preços de compra.

Para cada posição existente:

1. manter o cadastro;
2. definir `valuationMode = manual_balance`;
3. preservar `currentValueCents` e `valueAsOf`;
4. permitir ao usuário converter voluntariamente para `market_quote`;
5. na conversão, exigir ticker e uma posição inicial;
6. criar uma operação `correction` ou `buy` com quantidade, preço médio e data informados pelo usuário.

Uma posição antiga só passa a mostrar ganho/perda depois que custo e quantidade forem informados.

## 12. Testes necessários

### Unidade

- preço médio após múltiplas compras;
- venda parcial sem alteração indevida do preço médio;
- venda total zerando posição e custo;
- rejeição de venda acima da posição;
- taxas entrando no custo correto;
- cálculo de ganho e perda;
- quantidades fracionárias sem erro de ponto flutuante;
- separação entre reserva e demais investimentos;
- detecção de cotação vencida.

### Integração

- criação, edição e exclusão de operações no Turso/SQLite de teste;
- recálculo após alterar uma operação histórica;
- atualização de vários ativos por chamadas gratuitas individuais;
- validação do payload externo com Zod;
- fallback para última cotação quando o provedor falhar;
- nenhuma chamada externa real durante os testes: usar um `MarketDataProvider` falso.

### Interface

- cadastro de ação, FII e renda fixa;
- registro de compra e venda;
- estados vazio, carregando, sucesso, erro e cotação desatualizada;
- filtros de reserva e classe;
- responsividade da tabela e do detalhe.

## 13. Ordem de implementação

### Etapa 1 — Posições por operações

1. criar `investment_operations`;
2. evoluir `investment_holdings`;
3. implementar cálculo de posição e preço médio;
4. migrar posições atuais como saldo manual;
5. criar formulários de ativo e operação;
6. mostrar custo, quantidade e resultado usando cotação manual temporária.

Resultado: a carteira já registra corretamente compras e vendas, ainda sem depender de API externa.

### Etapa 2 — Cotações automáticas

1. criar contrato `MarketDataProvider`;
2. integrar brapi no servidor;
3. criar `investment_quotes`;
4. implementar atualização sob demanda com uma chamada por ticker e fallback;
5. substituir cotação manual por automática em ações e FIIs;
6. salvar o snapshot diário da carteira;
7. exibir horário, provedor e estado de atualização.

Resultado: ganho/perda de ações e FIIs é atualizado automaticamente.

### Etapa 3 — Reserva e renda fixa

1. tornar a reserva explícita na interface;
2. criar `fixed_income_terms`;
3. cadastrar Tesouro, CDB, LCI e LCA;
4. permitir atualização manual do saldo atual;
5. manter atualização manual do saldo desses produtos enquanto não houver fonte gratuita adequada;
6. adicionar estimativas por dados públicos de Selic e IPCA somente em uma evolução posterior, sem transformar estimativa em saldo oficial.

Resultado: reserva e investimentos aparecem separados, mas continuam formando um patrimônio único.

## 14. Critérios de aceite do MVP

O MVP estará pronto quando for possível:

- cadastrar uma ação pelo ticker;
- registrar duas compras em preços diferentes;
- visualizar quantidade e preço médio corretos;
- obter e armazenar uma cotação externa;
- visualizar valor atual e ganho/perda;
- atualizar a carteira por um botão e ver o horário da atualização;
- visualizar a evolução histórica de custo e valor de mercado;
- registrar uma venda parcial sem corromper o custo restante;
- cadastrar um FII com o mesmo fluxo;
- cadastrar Tesouro, CDB, LCI ou LCA com saldo atual manual;
- marcar ou alocar ativos como reserva;
- ver reserva e investimentos separadamente e também somados;
- continuar usando a última cotação quando a API estiver indisponível;
- identificar claramente a data/hora de todo valor externo ou manual.

## 15. Decisões recomendadas

1. **Usar operações como fonte de verdade**, não um valor atual digitado para ações e FIIs.
2. **Começar com o plano Gratuito da brapi atrás de uma interface própria**, para permitir troca futura sem contratar um serviço.
3. **Atualizar sob demanda e aceitar cotação atrasada**, pois o objetivo é evolução patrimonial, não negociação intradiária.
4. **Manter renda fixa privada manual no MVP**, evitando estimativas enganosas.
5. **Modelar reserva como finalidade**, reaproveitando as caixinhas já existentes.
6. **Não implementar proventos e imposto agora**, mas manter operações e cotações organizadas para essas evoluções.
7. **Não depender de nenhum endpoint pago**; renda fixa permanece manual quando o dado gratuito não for suficiente.

Esse recorte entrega a experiência central semelhante à visão de carteira do Investidor10 — posição, preço médio, valor atual e ganho/perda — sem transformar o projeto, neste momento, em uma plataforma completa de análise de investimentos.
