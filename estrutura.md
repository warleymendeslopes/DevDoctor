# Estrutura do projeto (fonte de verdade)

Este arquivo descreve a estrutura oficial do DevDoctor CLI.
Sempre que a arquitetura mudar, atualize este documento no mesmo PR.

## Arvore de diretorios

```text
devdoctor-cli/
├── bin/
│   └── index.js              # ponto de entrada do CLI (setup, explain, test, run)
│
├── src/
│   ├── commands/
│   │   ├── setup.js          # inicializacao/configuracao local
│   │   ├── run.js            # parse de flags + comando principal
│   │   ├── explain.js        # explica ultima falha salva
│   │   ├── history.js        # lista falhas salvas no historico
│   │   ├── repeat.js         # reroda um comando salvo por id
│   │   ├── test.js           # valida conectividade com provedor/modelo de IA
│   │   ├── doctor.js         # diagnostico local do ambiente e provider
│   │   └── context.js        # regenera contexto automatico para IA
│   │
│   ├── core/
│   │   ├── runner.js         # executa comando, captura saida, IA
│   │   ├── parser.js         # detecta e normaliza erros
│   │   ├── ai.js             # integra com API de IA
│   │   ├── analyzer.js       # decide hints, cache e chamada de IA
│   │   ├── formatter.js      # formata resposta para terminal
│   │   ├── output.js         # payloads estruturados para --json
│   │   ├── privacy.js        # sanitizacao e preview do payload
│   │   ├── context.js        # contexto minimo do projeto (package.json, .devdoctor/context.md)
│   │   ├── contextBuilder.js # gera .devdoctor/context.generated.md
│   │   ├── doctor.js         # checks locais do ambiente
│   │   ├── hints.js          # hints deterministas por stack conhecida
│   │   ├── signature.js      # assinatura estavel para deduplicacao
│   │   └── lastFailure.js    # persistencia da ultima falha (~/.devdoctor/last-failure.json)
│   │
│   └── utils/
│       ├── config.js         # config global (~/.devdoctor)
│       ├── confirmSend.js    # confirmacao opcional antes do envio
│       └── version.js        # versao lida do package.json
│
├── test/                     # testes (node --test)
├── docs/
│   └── context/              # contexto manual por dominio (overview, architecture, etc.)
├── scripts/
│   └── build-context.js      # gera contexto automatico local
├── package.json
├── README.md
├── README.en.md
├── LICENSE
└── .gitignore
```

## Responsabilidade por camada

- `bin/`: bootstrap, roteamento de comandos e help.
- `src/commands/`: interface de comandos/flags; nao contem regra de negocio pesada.
- `src/core/`: fluxo principal (execucao, deteccao, contexto, privacidade, analise e formatacao).
- `src/utils/`: utilitarios compartilhados e config.

## Fluxo principal

`bin/index.js` -> `commands/run.js` -> `core/runner.js` -> `core/parser.js` -> `core/privacy.js` + `core/context.js` -> `core/signature.js` -> `core/analyzer.js` -> (`core/hints.js` | `core/ai.js`) -> `core/formatter.js` / `core/output.js`

Comando `explain`: `bin/index.js` -> `commands/explain.js` -> `core/lastFailure.js` -> `core/ai.js`
Comando `test`: `bin/index.js` -> `commands/test.js` -> `core/ai.js`
Comando `history`: `bin/index.js` -> `commands/history.js` -> `core/lastFailure.js`
Comando `repeat`: `bin/index.js` -> `commands/repeat.js` -> `core/runner.js`
Comando `doctor`: `bin/index.js` -> `commands/doctor.js` -> `core/doctor.js`
Comando `context`: `bin/index.js` -> `commands/context.js` -> `core/contextBuilder.js`

## Regras de manutencao

- Se criar/mover/remover arquivo estrutural, atualize este arquivo.
- Se adicionar novo comando, refletir em `src/commands/`.
- Se adicionar novo modulo de negocio, refletir em `src/core/`.
- Evitar duplicar responsabilidade entre `commands` e `core`.
