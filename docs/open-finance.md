# Open Finance via MeuPluggy

A integração conecta bancos pelo MeuPluggy, vincula cada conta remota a uma conta local e registra execuções de sincronização. Nesta etapa nenhum lançamento, fatura ou investimento é importado.

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

## Limites

- **Sincronizar bancos** lê o que a Pluggy já coletou. Itens do MeuPluggy rejeitam `PATCH /items/{id}`, então o app não consegue forçar uma nova coleta. A aba mostra quando os dados foram coletados e quando a próxima coleta está prevista.
- `connector.name` é sempre `MeuPluggy` e não identifica o banco; por isso o nome do banco é definido por você.
- A API key dura 2 horas e é renovada automaticamente antes de expirar, somente em memória.
- As transações vêm de `GET /v2/transactions` por cursor, com no máximo 500 registros por página.
- Só uma sincronização roda por processo. A aplicação escuta apenas em loopback, portanto não há webhooks nem sincronização agendada.
- A sincronização fica indisponível no modo demonstração e enquanto a réplica local estiver somente consulta.

## Segurança

O segredo e a API key são lidos apenas no servidor e nunca aparecem em respostas ou logs. Identificadores remotos, nomes, status e resumos são gravados com a criptografia por campo do app; buscas usam somente as colunas `_hash`.
