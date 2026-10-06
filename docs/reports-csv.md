# Exportação de relatórios em CSV

Em `/reports`, selecione o modo e o período e clique em **Exportar resumo** ou
**Exportar categorias**. Nenhum arquivo é baixado automaticamente. Erros aparecem
na tela e não geram download. Os arquivos usam os mesmos dados e o mesmo regime
de competência do relatório: incluem pendências, parcelas de cartão e estornos;
excluem lançamentos cancelados e pagamentos de fatura já representados pelas parcelas.
Transferências e valorização patrimonial não entram nos resultados.

## Formato para planilhas

- UTF-8 com BOM, separador `;` e término de linha CRLF.
- Valores com vírgula decimal e duas casas, sem `R$` ou separador de milhares.
- Competências no formato `YYYY-MM`.
- Taxa de economia em pontos percentuais: `40,00` significa 40%. Sem receita
  positiva, a taxa fica vazia.
- Campos com `;`, aspas ou quebras de linha são envolvidos em aspas duplas;
  aspas internas são duplicadas.
- Texto iniciado por `=`, `+`, `-` ou `@`, mesmo depois de espaços ou controles,
  recebe apóstrofo inicial para impedir fórmulas. Valores negativos continuam numéricos.

No LibreOffice Calc ou importador compatível, selecione UTF-8, separador ponto e
vírgula, delimitador de texto aspas duplas e idioma Português (Brasil) para
reconhecer valores numéricos. O BOM preserva os acentos na detecção de codificação.
As [opções de importação do Calc](https://help.libreoffice.org/latest/pt-BR/text/shared/guide/csv_params.html)
também permitem configurar esses parâmetros pela linha de comando.

## Conteúdo

**Resumo:** competência, receitas, despesas, resultado antes dos investimentos,
aportes, resgates, investimentos líquidos, saldo livre e taxa de economia (%).
O mensal tem uma linha do mês selecionado, inclusive em meses vazios. O anual
inclui as competências exibidas no relatório (sem meses futuros no ano em curso)
e uma linha `TOTAL`. A taxa total é calculada sobre os totais, não pela média das taxas.

**Categorias:** competência, identificador da categoria, categoria e despesa líquida.
Há uma linha por categoria de despesa e mês com registros, incluindo categorias
arquivadas e o grupo `expense:uncategorized` (`Sem categoria`). O identificador
estável usa o mesmo formato do relatório, `expense:<id>`. Categorias apenas do
período anterior não geram linhas. Um mês sem despesas produz somente os cabeçalhos.
No anual, a soma das linhas de cada categoria corresponde ao valor selecionado na tela.

Nomes: `relatorio-resumo-mensal-2026-07.csv`,
`relatorio-categorias-anual-2026.csv`, conforme conteúdo, modo e período.

`GET /api/reports/export?mode=monthly&period=2026-07&kind=summary` (ou
`kind=categories`, `mode=annual&period=2026`) usa a autenticação existente e
`Cache-Control: private, no-store`, inclusive nos erros. Em modo demo, usa somente
o banco fictício isolado. CSV é um relatório e não um backup restaurável.

O modo de ocultar valores da issue #17 ainda não existe nesta versão; quando
implementado, deverá bloquear estas ações até o usuário revelar os valores.
