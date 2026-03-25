# Estrutura do projeto (fonte de verdade)

Este arquivo descreve a estrutura oficial do DevDoctor CLI.
Sempre que a arquitetura mudar, atualize este documento no mesmo PR.

## Arvore de diretorios

```text
devdoctor-cli/
├── bin/
│   └── index.js              # ponto de entrada do CLI (setup, explain, run)
│
├── src/
│   ├── commands/
│   │   ├── setup.js          # inicializacao/configuracao local
│   │   ├── run.js            # parse de flags + comando principal
│   │   └── explain.js        # explica ultima falha salva
│   │
│   ├── core/
│   │   ├── runner.js         # executa comando, captura saida, IA
│   │   ├── parser.js         # detecta e normaliza erros
│   │   ├── ai.js             # integra com API de IA
│   │   ├── formatter.js      # formata resposta para terminal
│   │   ├── privacy.js        # sanitizacao e preview do payload
│   │   ├── context.js        # contexto minimo do projeto (package.json, .devdoctor/context.md)
│   │   └── lastFailure.js    # persistencia da ultima falha (~/.devdoctor/last-failure.json)
│   │
│   └── utils/
│       ├── config.js         # config global (~/.devdoctor)
│       ├── confirmSend.js    # confirmacao opcional antes do envio
│       └── version.js        # versao lida do package.json
│
├── test/                     # testes (node --test)
├── docs/                     # posicionamento, backlog de conteudo, exemplos
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

`bin/index.js` -> `commands/run.js` -> `core/runner.js` -> `core/parser.js` -> `core/privacy.js` + `core/context.js` -> `core/ai.js` -> `core/formatter.js`

Comando `explain`: `bin/index.js` -> `commands/explain.js` -> `core/lastFailure.js` -> `core/ai.js`

## Regras de manutencao

- Se criar/mover/remover arquivo estrutural, atualize este arquivo.
- Se adicionar novo comando, refletir em `src/commands/`.
- Se adicionar novo modulo de negocio, refletir em `src/core/`.
- Evitar duplicar responsabilidade entre `commands` e `core`.
