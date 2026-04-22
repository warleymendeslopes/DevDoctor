# DevDoctor CLI

[![npm](https://img.shields.io/npm/v/devdoctor-cli.svg)](https://www.npmjs.com/package/devdoctor-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/node/v/devdoctor-cli)](https://nodejs.org/)

**DevDoctor** é um wrapper de linha de comando que **executa seus comandos** (build, testes, scripts) e, quando algo falha, **explica o erro em linguagem simples** com IA — sem copiar stack trace para o navegador.

**Em uma frase:** ele não substitui um agente que edita seu repositório (tipo Cursor/Warp); ele **captura a falha do terminal**, opcionalmente **resume o contexto do projeto** e **pede uma explicação estruturada** ao provedor que você escolher (OpenAI, Gemini ou **Ollama local**).

**English:** see [README.en.md](./README.en.md).

## Por que usar

- **Menos atrito mental:** saída original continua no `stdout`/`stderr`; a análise aparece ao final (ou depois, com `devdoctor explain`).
- **Privacidade configurável:** sanitização básica antes do envio, modo `--preview` para ver o que seria enviado, confirmação opcional com `DEVDOCTOR_CONFIRM_SEND=1`.
- **Custo sob controle:** use **Ollama** para não mandar nada para a nuvem; ou use APIs pagas quando quiser qualidade máxima.

## Instalação

### Uso global (recomendado)

```bash
npm install -g devdoctor-cli
```

### A partir do código

```bash
git clone https://github.com/warleymendeslopes/DevDoctor.git
cd DevDoctor
npm install
npm link
```

Requer **Node.js 18+**.

## Quickstart

```bash
devdoctor setup
devdoctor npm run build
```

Se houver erro reconhecido, o DevDoctor tenta explicar ao final. Para **ver o que seria enviado** sem chamar a API:

```bash
devdoctor --preview npm test
```

Para **não chamar a IA** mas ainda **guardar a falha** (útil em comandos lentos):

```bash
devdoctor --no-ai npm run e2e
devdoctor explain
```

## Comandos

| Comando | Descrição |
|--------|-----------|
| `devdoctor setup` | Configura OpenAI, Gemini ou Ollama (`~/.devdoctor/config.json`) |
| `devdoctor <cmd>` | Executa o comando e analisa erros ao detectar falha |
| `devdoctor explain [last\|id]` | Explica uma falha salva do histórico |
| `devdoctor history` | Lista falhas recentes, com ID e origem da análise |
| `devdoctor repeat <id>` | Reroda um comando salvo no histórico |
| `devdoctor test` | Testa conexão com o provedor/modelo configurado e valida resposta da IA |
| `devdoctor doctor` | Faz diagnóstico local do projeto e do provider configurado |
| `devdoctor context` | Regenera o contexto automático em `.devdoctor/context.generated.md` |

### Flags globais (antes do comando)

| Flag | Efeito |
|------|--------|
| `--preview` | Imprime o texto **sanitizado** que seria enviado; **não** chama a IA |
| `--no-ai` | Não chama a IA; ainda **salva** a falha para `explain` |
| `--yes` / `-y` | Confirma envio quando `DEVDOCTOR_CONFIRM_SEND=1` |
| `--json` | Emite saída estruturada para CI, integrações e automações |

Separe o comando com `--` se precisar: `devdoctor --preview -- npm run build`.

### Variáveis de ambiente

| Variável | Efeito |
|----------|--------|
| `DEVDOCTOR_CONFIRM_SEND=1` | Pede confirmação antes de enviar ao provedor (use com `--yes` em CI) |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` / `GOOGLE_API_KEY`, `GEMINI_MODEL` | Sobrescrevem config (OpenAI / Gemini) |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Sobrescrevem config do Ollama |

## Contexto do projeto (opcional)

- É lido um **resumo** do `package.json` (nome, scripts, engines).
- Opcional: crie **`.devdoctor/context.md`** na raiz do projeto (regras do time, gerenciador de pacotes, versão de Node, etc.).
- Opcional: mantenha docs curtos em `docs/context/` (overview, arquitetura, comandos, testes e convenções).
- Rode **`devdoctor context`** (ou `npm run context:build`) para gerar **`.devdoctor/context.generated.md`** automaticamente.
- O DevDoctor compõe contexto na ordem: `package.json` resumido -> `.devdoctor/context.md` -> `.devdoctor/context.generated.md`.
- Cada bloco e o total final são truncados para reduzir custo de tokens.

## Funcionalidades novas de analise

- **Hints determinísticos por stack conhecida:** casos como `npm ERESOLVE`, TypeScript, Jest, ESLint, Vite, Docker e `node-gyp` geram sugestões objetivas antes da IA.
- **Histórico de falhas:** o DevDoctor mantém um histórico local em `~/.devdoctor/history.json`, além da última falha.
- **Deduplicação por assinatura:** se o mesmo erro reaparecer no mesmo projeto, o CLI pode reutilizar uma análise anterior em vez de chamar a IA de novo.
- **Modo doctor:** valida Node, `package.json`, `engines`, lockfile, `node_modules`, contexto do projeto e conectividade/configuração do provider.

## Privacidade e segurança

- O DevDoctor envia ao provedor **apenas o trecho de erro analisado**, depois de **sanitização heurística** (ex.: padrões de chaves API, Bearer, blocos PEM, trechos muito longos estilo base64).
- **Isso não substitui revisão humana** em ambientes com dados sensíveis: use `--preview`, `--no-ai`, Ollama local ou políticas internas.
- **Não coloque segredos em logs de build**; mesmo sanitizado, o ideal é não vazar.

## Limitações

- Depende da **qualidade do modelo** (modelos Ollama pequenos podem ser superficiais).
- A detecção de erro é **heurística** (`parser.js`); casos exóticos podem não disparar análise.
- Não inspeciona o repositório inteiro como uma IDE; contexto é **resumido** por design.
- Pode adicionar **latência** ao final do comando quando a IA é chamada.

## Comparação rápida

| Fluxo | DevDoctor |
|-------|-----------|
| Copiar erro → colar no chat | Automatiza captura + formato + contexto mínimo |
| Agente que edita arquivos | Fora de escopo; foco é **explicar** a falha |

## Roadmap (ideias)

- Mais testes de regressão para formatos de erro comuns (npm, jest, tsc, etc.).
- Melhorias contínuas na sanitização e no preview.
- Opcional: cache por assinatura de erro.

## Contribuindo

Issues e PRs são bem-vindos: [github.com/warleymendeslopes/DevDoctor/issues](https://github.com/warleymendeslopes/DevDoctor/issues).

## Licença

MIT — veja [LICENSE](./LICENSE).

## Créditos

Provedores: [OpenAI](https://openai.com/), [Google AI](https://ai.google.dev/), [Ollama](https://ollama.com/).
