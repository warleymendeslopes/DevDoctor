# Estrutura do projeto (fonte de verdade)

Este arquivo descreve a estrutura oficial do DevDoctor CLI.
Sempre que a arquitetura mudar, atualize este documento no mesmo PR.

## Arvore de diretorios

```text
devdoctor-cli/
├── bin/
│   └── index.js              # ponto de entrada do CLI
│
├── src/
│   ├── commands/
│   │   ├── setup.js          # inicializacao/configuracao local
│   │   └── run.js            # comando principal (executar projeto)
│   │
│   ├── core/
│   │   ├── runner.js         # executa comando e captura stdout/stderr
│   │   ├── parser.js         # detecta e normaliza erros
│   │   ├── ai.js             # integra com API de IA
│   │   └── formatter.js      # formata resposta para terminal
│   │
│   └── utils/
│       └── config.js         # config global (~/.devdoctor)
│
├── package.json
├── README.md
└── .gitignore
```

## Responsabilidade por camada

- `bin/`: bootstrap e roteamento de comandos.
- `src/commands/`: interface de comandos/flags; nao contem regra de negocio pesada.
- `src/core/`: fluxo principal (execucao, deteccao, analise e formatacao).
- `src/utils/`: utilitarios compartilhados e config.

## Fluxo principal

`bin/index.js` -> `commands/run.js` -> `core/runner.js` -> `core/parser.js` -> `core/ai.js` -> `core/formatter.js`

## Regras de manutencao

- Se criar/mover/remover arquivo estrutural, atualize este arquivo.
- Se adicionar novo comando, refletir em `src/commands/`.
- Se adicionar novo modulo de negocio, refletir em `src/core/`.
- Evitar duplicar responsabilidade entre `commands` e `core`.
