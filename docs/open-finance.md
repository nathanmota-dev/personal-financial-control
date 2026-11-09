# Open Finance via MeuPluggy

A integração conecta bancos pelo MeuPluggy, vincula cada conta remota a uma conta local e importa os lançamentos de contas correntes e poupanças. Lançamentos de cartão, faturas e posições de investimento ainda não são importados.

## Configurar

1. Autorize seus bancos em [meu.pluggy.ai](https://meu.pluggy.ai).
2. Em [dashboard.pluggy.ai](https://dashboard.pluggy.ai), crie uma aplicação e copie o `client_id` e o `client_secret`.
3. Preencha `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` no `.env` e reinicie o app. Sem as duas variáveis, a aba explica o que falta e o restante do app funciona normalmente.
4. Execute `npm run db:migrate` para criar as tabelas da integração.
5. Em **Configurações > Open Finance**, adicione cada Item ID com um nome para o banco e vincule as contas remotas às contas locais.

## Vínculos

- Um cartão só pode ser vinculado a uma conta local de crédito; uma conta bancária, a uma conta corrente ou poupança.
- A data de corte define o primeiro dia considerado nas importações. Defina uma vez e evite alterá-la depois, pois a janela de histórico disponível avança com o tempo.
- Um vínculo desativado é ignorado pela sincronização e pode ser reativado.

## Identidade do titular

Em **Configurações > Open Finance**, informe os nomes completos e o CPF do titular e, se quiser, uma conta em **Outras contas próprias**. Esses dados ficam criptografados e o CPF nunca é devolvido por inteiro à tela.

## Classificação dos lançamentos

Cada lançamento novo recebe uma classificação, nesta ordem:

| Classificação | Regra | Resultado |
|---|---|---|
| Transferência própria | Pagador e recebedor são o titular, primeiro por CPF e depois por nome completo. Sem dados das partes, o nome completo na descrição | Uma transferência, sem receita nem despesa |
| Pagamento de fatura | Débito com `PAGAMENTO` seguido de `FATURA` na descrição | Nenhum lançamento, apenas o registro para o vínculo com a fatura |
| Aporte ou resgate | `operationType` de resgate ou de saldo reservado, ou `APLICACAO` e `RESGATE` na descrição quando o tipo é `OUTROS` ou vazio | Movimento de investimento na categoria padrão, sem reduzir posições |
| Comum | Todos os demais, incluindo rendimentos creditados na conta | Receita ou despesa, conforme `type` |

- Bastar um lado com o titular não prova nada, porque o banco preenche o lado dele em quase todos os lançamentos. Por isso os dois lados precisam corresponder.
- Um nome só corresponde por inteiro: `JOAO SILVA` não reconhece `JOAO SILVA SANTOS`.
- Quando só a outra parte parece ser o titular, o lançamento entra como comum e aparece em **Itens que precisam de atenção**.
- Transferências entre duas contas vinculadas viram um único registro, pareadas por valor e por uma janela de 1 dia. Sem o outro lado, usam **Outras contas próprias**. Se o outro lado chegar depois, a transferência é corrigida para a conta real. Sem essa conta configurada, a transferência aguarda em **Itens que precisam de atenção**.
- Transferências e pagamentos de fatura pendentes aguardam a confirmação do banco.

## Nova sincronização

- Datas são convertidas para `America/Sao_Paulo`, e registros anteriores à data de corte são ignorados.
- Um lançamento existente só recebe o que pertence ao banco: status e, enquanto pendente, valor e data. Categoria, notas e descrição nunca são sobrescritas.
- Se a Pluggy recriar um pendente com outro `id`, o lançamento confirmado assume a linha local com mesma conta, tipo e valor, em uma janela de 3 dias.
- Um pendente que some da Pluggy é cancelado e volta se reaparecer.

## Limites

- **Sincronizar bancos** lê o que a Pluggy já coletou. Itens do MeuPluggy rejeitam `PATCH /items/{id}`, então o app não consegue forçar uma nova coleta. A aba mostra quando os dados foram coletados e quando a próxima coleta está prevista.
- `connector.name` é sempre `MeuPluggy` e não identifica o banco; por isso o nome do banco é definido por você.
- A API key dura 2 horas e é renovada automaticamente antes de expirar, somente em memória.
- As transações vêm de `GET /v2/transactions` por cursor, com no máximo 500 registros por página.
- Só uma sincronização roda por processo. A aplicação escuta apenas em loopback, portanto não há webhooks nem sincronização agendada.
- A sincronização fica indisponível no modo demonstração e enquanto a réplica local estiver somente consulta.

## Segurança

O segredo e a API key são lidos apenas no servidor e nunca aparecem em respostas ou logs. Identificadores remotos, nomes, status e resumos são gravados com a criptografia por campo do app; buscas usam somente as colunas `_hash`.
