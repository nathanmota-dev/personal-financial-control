# Quality gate e evolução das baselines

As alterações desta entrega são manutenção explícita da infraestrutura. A regra
de imutabilidade continua bloqueando PRs que alteram arquivos protegidos; não há
flag para dispensá-la. Logs, sumários e o comentário consolidado mostram a regra
violada e os arquivos responsáveis. A aprovação de métricas é apresentada
separadamente do resultado geral do workflow. O publicador falha quando o
resultado consolidado é `FAIL`.

O diff do PR usa seu ancestral comum com a base. Uma atualização de baseline
exclusiva da `main` não aparece como alteração do PR. A configuração e as
baselines existentes continuam sendo lidas da base confiável.

## Performance

`scripts/benchmark-baseline.json` é a referência de CI, importada do artefato
`performance-pr-9-37181628895-1` da
[execução aprovada 37181628895](https://github.com/nathanmota-dev/personal-financial-control/actions/runs/37181628895),
no commit `c0ca11db9e4e0cba179456252be32dfec55b20d3`. Os valores e metadados
originais foram preservados. `scripts/benchmark-baseline.local.json` permanece
separada e é usada por `npm run quality:performance` fora de CI.

Em CI, a referência aponta para um commit completo e disponível no histórico.
O helper cria dois checkouts temporários, instala cada um separadamente e mede
três pares sequenciais: referência, código atual, referência, código atual,
referência, código atual. Entradas e configuração dos benchmarks devem ser
idênticas entre os commits. O aquecimento e os cenários existentes são mantidos.

Cada cenário usa a mediana de seus três valores de throughput. Uma perda acima
de 20%, referência inválida, benchmark obrigatório ausente ou medição incompleta
bloqueia o check. Cenários novos precisam de referência revisada antes da promoção.
O JSON, Markdown, logs e benchmarks brutos registram commits, runner, runtime,
execução, tentativa, throughput, RME e amostras. Os checkouts são removidos ao final,
inclusive quando um comando falha.

## Promoção na main

`promote-baselines.yml` valida o commit integrado com o quality gate completo e
com performance em pares. A promoção exige manifests, métricas e candidatos da
mesma execução, tentativa e SHA, além de todos os checks obrigatórios aprovados.
Qualidade e performance são avaliadas de forma independente para escolher os
arquivos elegíveis, mas a validação geral precisa estar aprovada.

- Qualidade mantém `no-regression`: cobertura por pacote e ponderada, duplicação
  e fragmentos não podem piorar. Arquivos e funções existentes não podem crescer
  durante a promoção; os limites de tamanho continuam protegidos. Deve existir
  pelo menos uma melhoria.
- Performance exige throughput igual ou maior em todos os cenários medidos na
  mesma máquina e pelo menos uma melhoria. Uma perda tolerada no check do PR
  impede a promoção da referência de performance.
- Somente os arquivos elegíveis são gravados. Sem melhoria, não há commit.
- Antes de gravar, a `main` remota deve continuar no SHA validado. Se avançar,
  a promoção é descartada. O push é comum, sem force; um avanço entre a consulta
  e o push também descarta a promoção.
- Commits contendo `[baseline-promotion]` e pushes que alteram apenas as duas
  baselines não iniciam nova promoção. O token do workflow precisa ter permissão
  de escrita compatível com as regras da branch para publicar o commit.

A baseline local nunca participa da promoção automática. Os relatórios ficam
nos artefatos da execução; nenhuma API da aplicação foi alterada.
