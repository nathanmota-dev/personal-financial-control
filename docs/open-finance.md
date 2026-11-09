# Open Finance via MeuPluggy

A integração conecta bancos pelo MeuPluggy, vincula cada conta remota a uma conta local e importa os lançamentos de contas correntes e poupanças, as compras de cartão e as faturas, com o vínculo dos pagamentos. Também mantém o valor atual das posições de investimento vinculadas, sem reconstruir o histórico de operações.

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

## Categorias aprendidas

A categoria é aprendida com as suas escolhas, sem usar o campo `category` da Pluggy, que é exclusivo do plano Pro.

- Ao mudar a categoria de um lançamento ou compra importados, o app grava uma regra para a descrição normalizada e o sentido (receita ou despesa) e aplica a categoria aos registros iguais ainda sem categoria. A mudança e a regra são gravadas juntas.
- A descrição normalizada fica em maiúsculas e sem acentos, parcelas (`PARC 03/05`, `3/5`), datas e números longos. Regras de receita e de despesa não colidem.
- Uma nova sincronização usa a regra ao criar o registro. Uma categoria escolhida por você nunca é sobrescrita, e lançamentos criados manualmente não geram nem recebem regras.
- Lançamentos bancários sem regra ficam sem categoria. Compras no cartão exigem categoria e usam **A classificar**, um grupo variável tratado como sem categoria no aviso do painel, no filtro de lançamentos e nos totais de fixos e variáveis.
- Em **Configurações > Open Finance > Pendências de categoria**, cada descrição pendente aparece uma vez, com ocorrências e total. Escolher a categoria cria a regra e a aplica a todos os registros pendentes iguais, inclusive compras de faturas já pagas, porque somente a categoria muda.
- Uma regra cuja categoria foi arquivada ou mudou de grupo é ignorada. Enquanto existir uma regra, a categoria não pode ser excluída.

## Nova sincronização

- Datas são convertidas para `America/Sao_Paulo`, e registros anteriores à data de corte são ignorados.
- Um lançamento existente só recebe o que pertence ao banco: status e, enquanto pendente, valor e data. Categoria, notas e descrição nunca são sobrescritas.
- Se a Pluggy recriar um pendente com outro `id`, o lançamento confirmado assume a linha local com mesma conta, tipo e valor, em uma janela de 3 dias.
- Um pendente que some da Pluggy é cancelado e volta se reaparecer.

## Compras no cartão

Um cartão precisa estar vinculado a uma conta local de crédito com dia de fechamento. Caso contrário, o vínculo é ignorado e o motivo aparece nas falhas da sincronização.

| Registro no cartão | Resultado |
|---|---|
| Valor positivo | Compra ou parcela |
| Valor negativo com `PAGAMENTO_FATURA` ou descrição iniciada por `PAGAMENTO` | Nenhuma compra, apenas o registro para o vínculo com a fatura |
| Demais valores negativos | Estorno, que reduz a fatura |

- Compras em moeda estrangeira usam `amountInAccountCurrency`. Sem esse campo, a compra não é importada e aparece em **Itens que precisam de atenção**.
- A Pluggy devolve uma transação por parcela, sem identificador comum. As parcelas são agrupadas por descrição normalizada, valor e número de parcelas, com tolerância de 1 centavo entre elas.
- O mês da fatura vem da fatura da parcela (mês de `dueDate`). Sem fatura, como em pendentes, vem do dia de fechamento. A primeira fatura é esse mês menos as parcelas anteriores, e duas compras iguais no mesmo mês continuam separadas.
- A compra recebe uma categoria das regras aprendidas ou **A classificar**. Categoria, notas e descrição editadas são mantidas nas próximas sincronizações.
- Com todas as parcelas, o total é a soma delas. Com parte delas, o total é reconstruído pela regra de arredondamento, em que os centavos extras ficam nas primeiras parcelas. Quando as parcelas recebidas não bastam para provar o valor exato, a diferença possível aparece em **Itens que precisam de atenção**.
- A data da compra vem de `purchaseDate` ou da parcela 1. Sem nenhuma delas, usa o fechamento da primeira fatura e registra nas notas que a data é aproximada, até a data real chegar.
- Uma nova entrega da mesma compra atualiza o registro existente. Compra em fatura paga não é alterada e aparece no resumo.
- Compras cujas faturas terminam antes do mês da data de corte são ignoradas. Compras iniciadas antes, com parcelas dentro da janela, são importadas por inteiro.
- Uma compra só com registros pendentes que a Pluggy recria confirmada com outro `id` assume a compra local de mesmo valor e parcelas, em uma janela de 3 dias. Se sumir da Pluggy, é removida e volta se reaparecer.

## Faturas e pagamentos

As faturas são importadas depois das compras, e cada fatura vira uma linha por cartão e mês, o mês de `dueDate`.

- A fatura anterior informa o saldo anterior, e os pagamentos da fatura com data antes de `billClosingDate` entram como pagamentos antes do fechamento.
- Fatura com total zero ou negativo não é importada e aparece em **Itens que precisam de atenção**.
- Fatura paga nunca é reescrita. Se o banco mudar o total ou o vencimento, a diferença é apenas informada.

A conferência de cada fatura usa `total = compras importadas + saldo anterior não pago - pagamentos antes do fechamento`. IOF e encargos já chegam como registros do cartão, por isso `financeCharges` não é somado. O resumo da sincronização mostra cada fatura como **Conferida**, **Com diferença** ou **Pagamento não vinculado**. Faturas anteriores ao mês da data de corte são gravadas, mas não comparadas.

Cada pagamento de fatura na conta corrente é procurado primeiro em `payments` das faturas, com mesmo valor e até 3 dias de distância, e depois em `totalAmount`, com até 15 dias do vencimento.

| Situação | Resultado |
|---|---|
| Na fatura, a partir do fechamento | `settlement`. Quando os pagamentos atingem o total, a fatura fica paga e trava as compras |
| Antes do fechamento | `pre_statement` |
| Sem fatura, com um único cartão vinculado | `unlinked`, informado para revisão |
| Fatura já paga | `unlinked`, informado para revisão |
| Mais de um cartão possível | Nada é registrado, e o caso aparece para revisão até só um corresponder |

- O pagamento é sempre um registro de `credit_card_bill_payments` com uma única transação, e por isso fica fora das despesas.
- Um pagamento já lançado manualmente, com mesma conta, valor e até 3 dias de distância, é reaproveitado.
- Um pagamento listado na fatura sem lançamento em conta vinculada só é informado, sem criar transação. A fatura continua em aberto.
- Enquanto um cartão ou uma conta não puder ser lido, os pagamentos sem correspondência aguardam a próxima sincronização.

## Investimentos

Em **Configurações > Open Finance > Investimentos**, cada posição do banco pode ser vinculada a um ativo existente ou virar um ativo novo. O app sugere o ativo por ticker, nome e instituição, e a escolha é sempre sua. O vínculo guarda somente o `id` da Pluggy, porque `code` e `isin` podem se repetir ou faltar, e não muda em novas sincronizações. **Desvincular** devolve o ativo ao controle manual.

A sincronização atualiza apenas valor e data. Nome, tipo e instituição vêm do banco só na criação do ativo.

| Situação | Resultado |
|---|---|
| Saldo manual (`manual_balance`) ou estimativa (`contract_estimate`) | Recebe `balance`, líquido de taxas e impostos, e a data informada pelo banco |
| Ativo cotado (`market_quote`) | Mantém a cotação, e a diferença para o banco aparece em **Itens que precisam de atenção** |
| Valor menor que o total alocado | Não muda e é informado, sem interromper as demais posições |
| `TOTAL_WITHDRAWAL` | É informado e nunca arquivado automaticamente |
| Sem saldo ou em outra moeda | Não muda e é informado |
| Ativo arquivado | É ignorado |

- Cada atualização grava o snapshot da posição no dia da sincronização. Repetir no mesmo dia substitui o snapshot.
- Esta etapa é a única que altera valores de posição. Aportes e resgates importados da conta corrente não reduzem ativos, então um resgate nunca é descontado duas vezes.
- A atualização mantém a alocação da reserva de emergência acompanhando o valor do ativo.
- Conectores expõem produtos diferentes. Uma conexão sem investimentos, ou com o recurso indisponível, aparece na aba e no resumo, sem contar como falha.

## Limites

- **Sincronizar bancos** lê o que a Pluggy já coletou. Itens do MeuPluggy rejeitam `PATCH /items/{id}`, então o app não consegue forçar uma nova coleta. A aba mostra quando os dados foram coletados e quando a próxima coleta está prevista.
- `connector.name` é sempre `MeuPluggy` e não identifica o banco; por isso o nome do banco é definido por você.
- A API key dura 2 horas e é renovada automaticamente antes de expirar, somente em memória.
- As transações vêm de `GET /v2/transactions` por cursor, com no máximo 500 registros por página.
- Só uma sincronização roda por processo. A aplicação escuta apenas em loopback, portanto não há webhooks nem sincronização agendada.
- A sincronização fica indisponível no modo demonstração e enquanto a réplica local estiver somente consulta.

## Segurança

O segredo e a API key são lidos apenas no servidor e nunca aparecem em respostas ou logs. Identificadores remotos, nomes, status e resumos são gravados com a criptografia por campo do app; buscas usam somente as colunas `_hash`.
