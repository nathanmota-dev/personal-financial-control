# Quality gate

O projeto usa a instalação local de `quality-gate-safe-delivery`. O registro em
`scripts/quality-gate.config.json` descreve os comandos, fontes, relatórios,
branch `main` e Node.js 24 usados pelos workflows.

## Instalação e execução local

```bash
npm ci
npm ci --prefix scripts
npm run quality:check
npm run quality:performance
```

Os dois comandos reinstalam as dependências do app. Execute-os em sequência,
pois ambos usam o mesmo `node_modules`. Os relatórios e logs ficam em `reports/`,
ignorados pelo Git.

Também é possível executar verificações individuais:

```bash
npm run build
npm run lint -- --max-warnings=0
npm run typecheck
npm run test
npm run test:coverage:ci
npm run benchmark:ci
npm run quality:test
```

`quality:check` executa instalação, auditorias, build, lint sem warnings,
TypeScript, a suíte completa com cobertura, testes dos helpers e coleta de
métricas. Vulnerabilidades críticas bloqueiam; vulnerabilidades altas ficam
visíveis como warnings. Não há suítes separadas de integração ou E2E cadastradas
no projeto. Os testes existentes de banco e APIs continuam na suíte completa
do Vitest e criam bancos SQLite temporários, sem precisar de Turso ou Firebase
reais.

## Fontes e regras

A cobertura e as métricas incluem `app/`, `components/`, `hooks/`, `lib/` e
`proxy.ts`, inclusive os componentes de UI. Testes e declarações `.d.ts` ficam
fora da cobertura e da duplicação. Configurações, ferramentas de manutenção e
helpers do gate não são código do app; as ferramentas CommonJS têm ignores
específicos no ESLint. As demais ferramentas do projeto continuam lintadas.

O scanner instalado aceita uma fonte isolada como `proxy.ts`, necessária para
o layout do Next.js na raiz. A seleção de benchmarks também reconhece alterações
nessa fonte. Essas adaptações têm testes no runner do Node.

Por decisão explícita na instalação, `qualityMode: "no-regression"` usa o estado
atual como referência. Os alvos de 80% de cobertura, 350 linhas por arquivo e
100 por função permanecem visíveis, mas a dívida já registrada é warning.
As regras que bloqueiam mudanças são:

- Nenhuma queda em linhas, statements, funções ou branches por pacote ou no
  total ponderado, perante a referência revisada. Os thresholds nativos do
  Vitest começam nos percentuais medidos nesta instalação; o coletor compara
  as razões exatas, sem tolerância de arredondamento.
- Nenhum erro ou warning de lint.
- Novos arquivos/funções devem respeitar 350/100 linhas. Arquivos e funções
  preexistentes acima desses alvos não podem crescer perante sua referência.
  As funções são identificadas por arquivo, nome e ordem de ocorrência desse
  nome, sem depender da linha inicial. Renomear uma função grande exige revisar
  a infraestrutura em escopo explícito, pois seu nome novo não herda a exceção.
- Duplicação e número de fragmentos não podem aumentar perante a referência.
- Perda de throughput maior que 20% e benchmarks rastreados ausentes bloqueiam.

O modo estrito original da skill permanece disponível e testado. A exceção
deste projeto aceita somente a dívida registrada; lint, duplicação, cobertura
completa e novos problemas de tamanho continuam protegidos. Não retire fontes
ou atualize uma referência estabelecida para esconder regressões.

## Benchmarks

`benchmarks/finance.bench.ts` mede funções usadas pelo app:

- Juros compostos com aportes mensais em 5 e 50 anos (60 e 600 meses).
- Projeção de saldo em 90 dias, com 100 eventos distribuídos e 5.000 eventos
  concentrados em três datas para exercitar agrupamento e ordenação.

Os inputs são determinísticos e criados fora da medição. Cada cenário tem
aquecimento de 500 ms e pelo menos 20 iterações; a medição dura pelo menos
1 segundo e 100 iterações. O Vitest executa com um worker e sem paralelismo de
arquivos. O relatório inclui throughput, RME e tamanho da amostra.

## Workflows e relatórios

Os workflows de PR para `main` são:

- `PR Quality Gate`: verificações e métricas de qualidade.
- `Performance`: benchmarks dos pacotes afetados; no bootstrap, mede todos.
- `PR Validation`: consolida artefatos do SHA e tentativa corretos em um
  comentário persistente e no status `PR Validation`.

Qualidade e performance publicam resumos e artefatos mesmo quando uma
verificação falha. O reporter usa `workflow_run`: ele passa a funcionar após
seu YAML e helpers estarem na branch padrão. Na instalação, revise os resumos
e artefatos dos dois workflows. Nenhuma configuração de deploy ou proteção
de branch é alterada.

Relatórios principais:

- `reports/quality-gate.md` e `.json`: cobertura, lint, duplicação e tamanho.
- `reports/performance.md` e `.json`: benchmarks e comparação.
- `reports/quality-workflow.json` e `reports/performance-workflow.json`:
  resultados de cada comando, incluindo falhas, warnings e não selecionados.
- `reports/logs/`: diagnósticos de cada comando.
- `coverage/index.html`: cobertura navegável do app.

## Bootstrap e referências

`scripts/baseline.json` registra a cobertura, duplicação e tamanhos reais do app
na instalação, conforme autorização para começar sem regressões do estado atual.
Essa referência de qualidade depende dos fontes e testes, não da velocidade
da máquina. A dívida abaixo dos alvos aparece nos relatórios como warning.

`scripts/benchmark-baseline.local.json` registra os quatro benchmarks na máquina
local. O coletor verifica tipo de runner, CPU local, plataforma, arquitetura e
versão principal do Node antes de comparar. O CI usa exclusivamente
`scripts/benchmark-baseline.json`; nunca compara contra velocidades locais.

A primeira execução no GitHub ainda é bootstrap de performance: revise o
candidato `reports/benchmark-candidate-baseline.json` da tentativa exata do CI
antes de introduzir `scripts/benchmark-baseline.json`. Bootstrap registra
medições e não comprova ausência de regressão histórica. Durante a instalação
do PR, os workflows também podem mostrar bootstrap de qualidade enquanto a
referência ainda não existe na branch base.

Os candidatos em `reports/` nunca substituem automaticamente as referências.
Uma referência estabelecida não deve ser alterada em tarefas comuns.
`--update-baseline` é uma operação explícita e local, proibida no CI, e rejeita
resultados que piorem a referência existente. Melhorias futuras podem endurecer
a referência mediante revisão explícita.
